var form_borough = "";

var updateChart = function(chart, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}

		// converting strings to numbers
		item.initial_cost = Number(item.initial_cost.replace(/[^0-9\.]+/g,"")).toFixed(2);
		item.total_est__fee = Number(item.total_est__fee.replace(/[^0-9\.]+/g,"")).toFixed(2);
	});
	
	console.log('data after corrections', data);
	// group by array records on borough
	var totalsByBorough = alasql(`
		SELECT zoning_dist1,
			AVG(total_est__fee) as total_est__fee
		FROM ?
		WHERE total_est__fee IS NOT NULL
		  AND borough = ?
		GROUP BY zoning_dist1`, [data, form_borough]);

	console.log('data after aggregation', totalsByBorough);
	chart.load({
		json: totalsByBorough,
		keys: {
			x: 'zoning_dist1',
			value: ['total_est__fee'],
		},
		axis: {
			x: {
				label: 'Zoning District'
			},
			y: {
				label: 'Average Job Cost $USD'
			}
		},
		type: 'bar'
	});
};

if (Meteor.isClient) {
	var chart;
	Template.dobjobData.events({
		'submit .updateChart': function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var limit = event.target.limit.value;
	  form_borough = event.target.borough.value;
	  console.log("Borough: "+ form_borough);
	  
			Meteor.call('getDOBJOBData', {
				// pass limit and date parameters
				// more info on fields at https://data.cityofnewyork.us/resource/rvhx-8trz.json
					'$limit': limit
				}, function (err, result) {
					updateChart(chart, result.data);
				});
    }
	});
	Template.dobjobData.rendered = function () {
		// start with initial data
		const initialData = [
			{borough: 'UNKNOWN'},
			{borough: 'MANHATTAN'},
			{borough: 'BRONX'},
			{borough: 'BROOKLYN'},
			{borough: 'QUEENS'},
			{borough: 'STATEN ISLAND'}
    ];
		chart = c3.generate({
			bindto: this.find('#chart'), // binds chart to html div element with id 'chart'
			data: {
				json: initialData,
				keys: {
					x: 'borough',
					value: ['total_est__fee'],
				},
				type: 'bar',
				labels: true
			},
			axis: {
				x: {
					// x axis becomes the borough names
					type: 'category',
					label: 'Zoning District'
				},
				y: {
					label: 'Average Job Cost $USD'
				}
			}
		});
	};
}

if (Meteor.isServer) {
	Meteor.methods({
		getDOBJOBData(params) {
			const jobData = HTTP.call('GET', 'https://data.cityofnewyork.us/resource/rvhx-8trz.json', {
				headers: {
					'X-App-Token': 'OHtMv1rX1n6MGFBi3AJVVyKQn'
				},
				params: params
			});
			return jobData;
		}
	});
}
