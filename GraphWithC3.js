var updateChart = function(chart, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}

		// converting strings to numbers
		item.initial_cost = Number(item.initial_cost.replace(/[^0-9\.]+/g,"")).toFixed(2);
		if(item.initial_cost == 0) {
			item.initial_cost = ' ';
		}
		
		
		item.total_est__fee = Number(item.total_est__fee.replace(/[^0-9\.]+/g,"")).toFixed(2);
		if(item.total_est__fee.isNumeric) {
			item.total_est__fee = ' ';
		}
	});

	console.log('data after corrections', data);
	// group by array records on borough
	var totalsByBorough = alasql(`
		SELECT borough,
			COUNT(job__) as job_requested,
			COUNT(assigned) as assigned,
			COUNT(approved) as approved,
			COUNT(fully_paid) as fully_paid
		FROM ? GROUP BY borough`, [data]);

	console.log('data after aggregation', totalsByBorough);
	chart.load({
		json: totalsByBorough,
		keys: {
			x: 'borough',
			value: ['job_requested',
			'assigned',
			'approved',
			'fully_paid'],
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
					value: ['job_requested',
						'assigned',
						'approved',
						'fully_paid'],
				},
				type: 'bar',
				// makes bars stack
				groups: [
					['job_requested',
						'assigned',
						'approved',
						'fully_paid']
        ],
				labels: true
			},
			axis: {
        x: {
					// x axis becomes the borough names
          type: 'category'
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
