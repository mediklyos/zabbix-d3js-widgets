//
// class triggerTable
//

function triggerTable(arg) {
	var server = new $.jqzabbix(arg.server);
	var method = 'trigger.get';
	var limit = typeof arg.maxItems !== 'undefined' ? arg.maxItems : 25;
	var priority = [];
	for (var i = typeof arg.minPriority !== 'undefined' ? arg.minPriority : 2; i < 6; i++) priority.push(i); 
	var params = {
		'filter': { 'value': 1 },
		'min_severity': typeof arg.minPriority !== 'undefined' ? arg.minPriority : 2,
		'monitored': typeof arg.monitored !== 'undefined' ? arg.monitored : 1,
		'withLastEventUnacknowledged': typeof arg.withLastEventUnacknowledged !== 'undefined' ? arg.withLastEventUnacknowledged : 1,
		'skipDependent': 1,
		'output': [ 'triggerid', 'state', 'error', 'url', 'description', 'priority','lastchange' ],
		'selectHosts': ['name'],
		'expandDescription': 1,
		'sortfield': [ 'lastchange' ],
		'sortorder': [ 'DESC' ],
		'limit': 2 * limit
	};
	var refresh = typeof arg.refresh !== 'undefined' ? arg.refresh : 10;
	var delayed = typeof arg.oldDelayed !== 'undefined' ? arg.oldDelayed : 1;
	var width = $(arg.bindTo).width();
	$( window ).unload(function() {
		server.sendAjaxRequest('user.logout', null, null, null);
	});
	doAuth();

	function startRequests() {
		server.sendAjaxRequest(method, params, successMethod, errorMethod);
		setTimeout(startRequests, refresh * 1000);
	}

	function doAuth(){
		server.userLogin(null, function() {
			$(arg.bindTo).empty();
			startRequests();
		},
		errorMethod );
	}

	function row(d) {
		function pad(s) {
			r = s.toString();
			return r.length == 1 ? '0' + r : r;
		}
		var dat = new Date(d.lastchange*1000);
		return '<b>' + d.hosts[0].name + '</b>: ' 
			+ d.description
			+ '<p class=datetime>'
			+ pad(dat.getDate()) + '.' +  pad(dat.getMonth() + 1) + '.' + dat.getFullYear() + ' ' 
			+ pad(dat.getHours()) + ':' + pad(dat.getMinutes()) + ':' + pad(dat.getSeconds())
			+ '</p>';
	}

	var errorMethod = function() {
		var errormsg = '';
		$.each(server.isError(), function(key, value) {
			errormsg += '<li>' + key + ' : ' + value + '</li>';
		});
		$(arg.bindTo).html('<ul>' + errormsg + '</ul>');
	}

	var successMethod = function(response, status) {
		width = $(arg.bindTo).width();
		var elements = response.result.length;
		var p = d3.select(arg.bindTo)
			.selectAll("div")
			.data(response.result.reverse(), function(d) { return d.triggerid; })
			.html(function(d) { return row(d) })
			.style("width", width+'px')
			.style('display', function(d,i) {
				if (i < elements-limit) return 'none';
				else return 'block';
			});
		p.enter()
			.insert("div", ":first-child")
			.html(function(d) { return row(d) })
			.attr("class", function(d) {
				return 'alert' + d.priority;
			})
			.style('display', function(d,i) {
				if (i < elements-limit) return 'none';
				else return 'block';
			})
			.style("width", width+'px')
			.style("margin-left", '-' + (100 + width) + 'px')
			.transition()
			.delay(function(d) { if (delayed) return ($.now()-d.lastchange*1000)/100000; else return 0; })
			.duration(1200)
			.ease('bounce')
			.style("margin-left", "0px")
			.style("margin-bottom", "0px");
		p.exit()
			.transition()
			.duration(3000)
			.ease('back')
			.style("margin-left", "1000px")
			.duration(1000)
			.style("height", "0px")
			.remove();
	}
}