var updateChart = function(chart, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}

		// converting strings to numbers
		item.number_of_cyclist_injured = Number(item.number_of_cyclist_injured);
		item.number_of_cyclist_killed = Number(item.number_of_cyclist_killed);
		item.number_of_motorist_injured = Number(item.number_of_motorist_injured);
		item.number_of_motorist_killed = Number(item.number_of_motorist_killed);
		item.number_of_pedestrians_injured = Number(item.number_of_pedestrians_injured);
		item.number_of_pedestrians_killed = Number(item.number_of_pedestrians_killed);
		item.number_of_persons_injured = Number(item.number_of_persons_injured);
		item.number_of_persons_killed = Number(item.number_of_persons_killed);
	});

	console.log('data after corrections', data);
	// group by array records on borough
	var totalsByBorough = alasql(`
		SELECT borough,
			SUM(number_of_cyclist_injured) as number_of_cyclist_injured,
			SUM(number_of_cyclist_killed) as number_of_cyclist_killed,
			SUM(number_of_motorist_injured) as number_of_motorist_injured,
			SUM(number_of_motorist_killed) as number_of_motorist_killed,
			SUM(number_of_pedestrians_injured) as number_of_pedestrians_injured,
			SUM(number_of_pedestrians_killed) as number_of_pedestrians_killed,
			SUM(number_of_persons_injured) as number_of_persons_injured,
			SUM(number_of_persons_killed) as number_of_persons_killed
		FROM ? GROUP BY borough`, [data]);

	console.log('data after aggregation', totalsByBorough);
	chart.load({
		json: totalsByBorough,
		keys: {
			x: 'borough',
			value: ['number_of_cyclist_injured',
			'number_of_cyclist_killed',
			'number_of_motorist_injured',
			'number_of_motorist_killed',
			'number_of_pedestrians_injured',
			'number_of_pedestrians_killed',
			'number_of_persons_injured',
			'number_of_persons_killed'],
		},
		type: 'bar'
	});
};

if (Meteor.isClient) {
	var chart;
	Template.nypdData.events({
		'submit .updateChart': function (event) {
      // Prevent default browser form submit
      event.preventDefault();

      // Get value from form element
      var limit = event.target.limit.value;
			var date = event.target.date.value;

			Meteor.call('getCollisionData', {
				// pass limit and date parameters
				// more info on fields at https://dev.socrata.com/foundry/#/data.cityofnewyork.us/qiz3-axqb
					'$limit': limit,
					date: date
				}, function (err, result) {
					updateChart(chart, result.data);
				});
    }
	});
	Template.nypdData.rendered = function () {
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
					value: ['number_of_cyclist_injured',
					'number_of_cyclist_killed',
					'number_of_motorist_injured',
					'number_of_motorist_killed',
					'number_of_pedestrians_injured',
					'number_of_pedestrians_killed',
					'number_of_persons_injured',
					'number_of_persons_killed'],
				},
				type: 'bar',
				// makes bars stack
				groups: [
					['number_of_cyclist_injured',
						'number_of_cyclist_killed',
						'number_of_motorist_injured',
						'number_of_motorist_killed',
						'number_of_pedestrians_injured',
						'number_of_pedestrians_killed',
						'number_of_persons_injured',
						'number_of_persons_killed']
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
		getCollisionData(params) {
			const collisionData = HTTP.call('GET', 'https://data.cityofnewyork.us/resource/qiz3-axqb.json', {
				headers: {
					'X-App-Token': ''
				},
				params: params
			});
			return collisionData;
		}
	});
}
