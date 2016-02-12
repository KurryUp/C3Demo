var form_borough = "";


var updateCity = function(chartCity, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}

		// converting strings to numbers
		item.initial_cost = parseFloat(item.initial_cost.replace(/[^0-9\.]+/g,""));
		
		var tempstr = item.city_;
		if(item.city_ != undefined) {
			item.city_ = item.city_.trim();
		}
	});
	
	console.log('data after corrections', data);
	// group by array records on borough
	var jsonChartData = alasql(`
		SELECT borough, ROUND(AVG(initial_cost), 2) as initial_cost
		FROM ?
		GROUP BY borough`, [data]);

	console.log('data after aggregation', jsonChartData);
	chartCity.load({
		json: jsonChartData,
		keys: {
			x: 'borough',
			value: ['initial_cost'],
		},
		axis: {
			x: {
				label: 'Borough'
			},
			y: {
				label: 'Initial Cost $USD'
			}
		},
		type: 'bar'
	});
};

var updateBorough = function(chartBorough, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}
	});

	console.log('data after corrections', data);
	// group by array records on borough
	var jsonChartData = alasql(`
		SELECT borough,
			COUNT(job__) as job_requested,
			COUNT(assigned) as assigned,
			COUNT(approved) as approved,
			COUNT(fully_paid) as fully_paid
		FROM ? GROUP BY borough`, [data]);

	console.log('data after aggregation', jsonChartData);
	chartBorough.load({
		json: jsonChartData,
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

var updateZone = function(chartZone, data) {
	console.log('raw data', data);
	_.each(data, function(item) {
		// handle records where borough is not specified
		if (!item.borough) {
			item.borough = 'UNKNOWN';
		}

		// converting strings to numbers
		item.initial_cost = Number(item.initial_cost.replace(/[^0-9\.]+/g,"")).toFixed(2);
		item.total_est__fee = parseFloat(item.total_est__fee.replace(/[^0-9\.]+/g,""));
		
		var tempstr = item.zoning_dist1;
		if(item.zoning_dist1 != undefined) {
			item.zoning_dist1 = item.zoning_dist1.trim();
		}
	});
	
	console.log('data after corrections', data);
	// group by array records on borough
	var jsonChartData = alasql(`
		SELECT zoning_dist1, ROUND(AVG(total_est__fee), 2) as total_est__fee
		FROM ?
		WHERE borough = ?
		GROUP BY zoning_dist1`, [data, form_borough]);

	console.log('data after aggregation', jsonChartData);
	chartZone.load({
		json: jsonChartData,
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
	var chartZone;
	var chartBorough;
	var chartCity;
	
	Template.dobZoneData.events({
		'change #borough': function(event, template) {
			form_borough = template.$('#borough').val();
			console.log("Borough: " + form_borough);
		},
		'submit .updateZone': function (event) {
			// Prevent default browser form submit
			event.preventDefault();

			// Get value from form element
			var limit = event.target.limit.value;
	  
			Meteor.call('getdobJobData', {
				// pass limit and date parameters
				// more info on fields at https://data.cityofnewyork.us/resource/rvhx-8trz.json
					'$limit': limit
				}, function (err, result) {
				updateZone(chartZone, result.data);
				updateBorough(chartBorough, result.data);
				updateCity(chartCity, result.data);
			});
		}
	});
	Template.dobZoneData.rendered = function () {
		// start with initial data
		const initialData = [	];
		chartZone = c3.generate({
			bindto: this.find('#chartZone'), // binds chartZone to html div element with id 'chartZone'
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
		
		chartBorough = c3.generate({
			bindto: this.find('#chartBorough'), // binds chart to html div element with id 'chart'
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
				labels: true
			},
			axis: {
				x: {
					// x axis becomes the borough names
					type: 'category'
				}
			}
		});
		
		chartCity = c3.generate({
			bindto: this.find('#chartCity'), // binds chart to html div element with id 'chart'
			data: {
				json: initialData,
				keys: {
					x: 'city',
					value: ['total_est__fee'],
				},
				type: 'bar',
				labels: true
			},
			axis: {
				x: {
					// x axis becomes the borough names
					type: 'category',
					label: 'Cities'
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
		getdobJobData(params) {
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
