/**
 * Flot plugin for adding 'events' to the plot.
 *
 * Events are small icons drawn onto the graph that represent something happening at that time.
 *
 * This plugin adds the following options to flot:
 *
 * options = {
 *	  events: {
 *		  data: [],	 // array of event objects
 *		  types: []	 // array of colors
 *		  xaxis: int	// the x axis to attach events to
 *	  }
 *  };
 *
 *
 * An event is a javascript object in the following form:
 *
 * {
 *	  min: startTime,
 *	  max: endTime,
 *	  eventType: "type",
 *	  title: "event title",
 *	  description: "event description"
 * }
 *
 * Types is an array of javascript objects in the following form:
 *
 * types: [
 *	 {
 *		 eventType: "eventType",	   // name [a-zA-Z0-9_]
 *		 color: #F00
 *	 }
 *  ]
 *
 * @author Joel Oughton
 * @author Alexander Wunschik
 */
(function($){
	
	/**
	 * A class that allows for the drawing an remove of some object
	 *
	 * @param {Object} object
	 *		  the drawable object
	 * @param {Object} drawFunc
	 *		  the draw function
	 * @param {Object} clearFunc
	 *		  the clear function
	 */
	var DrawableEvent = function(object, drawFunc, clearFunc, moveFunc, left, top, width, height){
		var _object = object, 
			_drawFunc = drawFunc, 
			_clearFunc = clearFunc,
			_moveFunc = moveFunc, 
			_position = { left: left, top: top }, 
			_width = width, 
			_height = height;
		
		this.width = function() { return _width; };
		this.height = function() { return _height };		
		this.position = function() { return _position; };
		this.draw = function() { _drawFunc(_object); };
		this.clear = function() { _clearFunc(_object); };
		this.getObject = function() { return _object; };
		this.moveTo = function(position) {
			_position = position;
			_moveFunc(_object, _position);
		};
	}
	
	/**
	 * Event class that stores options (eventType, min, max, title, description) and the object to draw.
	 *
	 * @param {Object} options
	 * @param {Object} drawableEvent
	 */
	var VisualEvent = function(options, drawableEvent){
		var _parent, 
			_options = options, 
			_drawableEvent = drawableEvent,
			_hidden = false;
		
		this.visual = function() { return _drawableEvent; }
		this.getOptions = function() { return _options; };
		this.getParent = function() { return _parent; };
		this.isHidden = function() { return _hidden; };
		this.hide = function() { _hidden = true; };
		this.unhide = function() { _hidden = false; };
	};
	
	/**
	 * @class TODO
	 */
	var Marker = function() {
		
	};
	
	
	function init(plot){
		var _events = [], 
			_types, 
			_eventsEnabled = false, 
			lastRange;
		
		plot.getEvents = function(){
			return _events;
		};
		
		plot.hideEvents = function(){
			$.each(_events, function(index, event){
				event.visual().getObject().hide();
			});
		};
		
		plot.showEvents = function(){
			plot.hideEvents();
			$.each(_events, function(index, event){
				event.hide();
			});
			
			_drawEvents();
		};
		
		plot.hooks.processOptions.push(function(plot, options){
			// enable the plugin
			if (options.events.data != null) {
				_eventsEnabled = true;
			}
		});
		
		plot.hooks.draw.push(function(plot, canvascontext){
			var options = plot.getOptions();
			var xaxis = plot.getXAxes()[options.events.xaxis - 1];
			
			if (_eventsEnabled) {
				// check for first run
				if (_events.length < 1) {
					_lastRange = xaxis.max - xaxis.min;
					_types = options.events.types;
					_setupEvents(options.events.data);
				} else {
					_updateEvents();
				}
			}
			
			_drawEvents();
		});
		
		/**
		 * TODO
		 */
		var _drawEvents = function() {
			var o = plot.getPlotOffset();
			var pleft = o.left, pright = plot.width() - o.right;

			$.each(_events, function(index, event){
							
				// check event is inside the graph range
				if (_insidePlot(event.getOptions().min) &&
					!event.isHidden()) {
					event.visual().draw();
				}  else {
					event.visual().getObject().hide(); 
				}
			});
		};
		
		/**
		 * TODO
		 */
		var _clearEvents = function(){			
			$.each(_events, function(index, val) {
				val.visual().clear();
			});

			_events = [];
		};
		
		/**
		 * TODO
		 */
		var _updateEvents = function() {
			var o = plot.getPlotOffset(), left, top;
			var xaxis = plot.getXAxes()[plot.getOptions().events.xaxis - 1];
			
			$.each(_events, function(index, event) {
				top = o.top + plot.height() - event.visual().height();
				left = xaxis.p2c(event.getOptions().min) + o.left - event.visual().width() / 2;
				
				event.visual().moveTo({ top: top, left: left });
			});
		};
		
		/**
		 * TODO
		 */
		var _showTooltip = function(x, y, event){
			var tooltip = $('<div id="tooltip" class="'+event.eventType+'"></div>').appendTo('body').fadeIn(200);
			
			$('<div id="title" style="font-weight:bold;">' + event.title + '</div>').appendTo(tooltip);
			$('<div id="type" style="font-style: italic;">Type: ' + event.eventType + '</div>').appendTo(tooltip);
			$('<div id="description">' + event.description + '</div>').appendTo(tooltip);
			
			tooltip.css({
				top: y+20,
				left: x,
				
				"position": "absolute",
				"width": "300px",
				"border": "1px solid #666",
				"padding": "2px",
				"background-color": "#CCC",
				"opacity": "0.80",
				"font-size": "smaller",
				"cursor": "move"
			});
		};
		
		/**
		 * TODO
		 */
		var _setupEvents = function(events){
			$.each(events, function(index, event){
				_events.push(new VisualEvent(event, _buildDiv(event)));
			});
			
			_events.sort(function(a, b) {
				var ao = a.getOptions(), bo = b.getOptions();
				if (ao.min > bo.min) return 1;
				if (ao.min < bo.min) return -1;
				return 0;
			});
		};
		
		/**
		 * TODO
		 */
		var _buildDiv = function(event){
			//var po = plot.pointOffset({ x: 450, y: 1});
			var container = plot.getPlaceholder(), o = plot.getPlotOffset(), yaxis, 
			xaxis = plot.getXAxes()[plot.getOptions().events.xaxis - 1], axes = plot.getAxes();
			var top, left, div, color, drawableEvent;
			
			// determine the y axis used
			if (axes.yaxis && axes.yaxis.used) yaxis = axes.yaxis;
			if (axes.yaxis2 && axes.yaxis2.used) yaxis = axes.yaxis2;
			
			// map the eventType to a types object
			var eventTypeId = -1;
			$.each(_types, function(index, type){
				if (type.eventType == event.eventType) {
					eventTypeId = index;
					return false;
				}
			});
			
			if (_types == null || !_types[eventTypeId] || !_types[eventTypeId].color) {
				color = '#666';
			} else {
				color = _types[eventTypeId].color;
			}
			
			line = $('<div class="events_line"></div>').appendTo(container);
			marker = $('<div class="events_marker"></div>').appendTo(line);
			
			top = o.top + plot.height();
			left = xaxis.p2c(event.min) + o.left;
			
			line.css({
				"position": "absolute",
				"opacity": 0.8,
				"left": left + 'px',
				"top": 8,
				"width": "1px",
				"height": plot.height(),
				
				"border-left-width": "1px",
				"border-left-style": "dashed",
				"border-left-color": color
			});
			line.hide();
			
			var ms = 5;
			marker.css({
				"position": "absolute",
				"left": -ms-1+"px",
				"top": "0px",
				"cursor": "help",
				"font-size": 0,
				"line-height": 0,
				"width": 0,
				"height": 0, 
				"border-left": ms+"px solid transparent",
				"border-right": ms+"px solid transparent",
				"border-top": ms+"px solid " + color,
				"border-bottom": "none",
			});
			
			if (event.position && event.position.toUpperCase() === 'BOTTOM') {
				marker.css({
					"top": top-ms-8 +"px",
					"border-top": "none",
					"border-bottom": ms+"px solid " + color,
				});
			}
			
			marker.data({
				"event": event
			});
			marker.hover(
				// mouseenter
				function(){
					var pos = $(this).offset();
					if (event.position && event.position.toUpperCase() === 'BOTTOM') {
						pos.top -= 150;
					}
					
					_showTooltip(pos.left, pos.top, $(this).data("event"));
					
					if (event.min != event.max) {
						plot.setSelection({
							xaxis: {
								from: event.min,
								to: event.max
							},
							yaxis: {
								from: yaxis.min,
								to: yaxis.max
							}
						});
					}
				},
				// mouseleave
				function(){
					//$(this).data("bouncing", false);
					$('#tooltip').remove();
					plot.clearSelection();
			});
			
			drawableEvent = new DrawableEvent(
				line,
				function(obj) { obj.show(); },
				function(obj){ obj.remove(); },
				function(obj, position){
					obj.css({
						top: position.top,
						left: position.left
					});
				},
				left, 
				top, 
				line.width(), 
				line.height()
			);
			
			return drawableEvent;
		};
		
		/**
		 * TODO
		 */
		var _getEventsAtPos = function(x, y){
			var found = [], left, top, width, height;
			
			$.each(_events, function(index, val){
			
				left = val.div.offset().left;
				top = val.div.offset().top;
				width = val.div.width();
				height = val.div.height();
				
				if (x >= left && x <= left + width && y >= top && y <= top + height) {
					found.push(val);
				}
				
				return found;
			});
		};
		
		/**
		 * TODO
		 */
		var _insidePlot = function(x) {
			var xaxis = plot.getXAxes()[plot.getOptions().events.xaxis - 1];
			var xc = xaxis.p2c(x);
			return xc > 0 && xc < xaxis.p2c(xaxis.max);
		};
		
	}//init
	
	var options = {
		events: {
			data: null,
			types: null,
			xaxis: 1,
			position: 'TOP'
		}
	};
	
	$.plot.plugins.push({
		init: init,
		options: options,
		name: "events",
		version: "0.20"
	});
})(jQuery);
