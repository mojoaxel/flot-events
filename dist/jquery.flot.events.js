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
	var Marker = function(plot) {
		var _events = [],
			_eventsEnabled = false, 
			_lastRange;
		
		this._types = [];
		this.plot = plot;
		
		this.getEvents = function() {
			return _events;
		};
		
		this.setTypes = function(types) {
			return this._types = types;
		}
		
		this.setLastRage = function(lastRange) {
			return this._lastRange = lastRange;
		}
		
		this.getEventsEnabled = function() {
			return _eventsEnabled;
		};
		
		this.setEventsEnabled = function(state) {
			return _eventsEnabled = state;
		}
		
		/**
		 * TODO
		 */
		this.drawEvents = function() {
			var that = this;
			var o = this.plot.getPlotOffset();
			var pleft = o.left, pright = this.plot.width() - o.right;

			$.each(_events, function(index, event){
							
				// check event is inside the graph range
				if (that._insidePlot(event.getOptions().min) &&
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
		this.updateEvents = function() {
			var that = this;
			var o = this.plot.getPlotOffset(), left, top;
			var xaxis = this.plot.getXAxes()[this.plot.getOptions().events.xaxis - 1];
			
			$.each(_events, function(index, event) {
				top = o.top + that.plot.height() - event.visual().height();
				left = xaxis.p2c(event.getOptions().min) + o.left - event.visual().width() / 2;
				
				event.visual().moveTo({ top: top, left: left });
			});
		};

		/**
		 * TODO
		 */
		this.setupEvents = function(events){
			var that = this;
			$.each(events, function(index, event){
				var ve = new VisualEvent(event, that._buildDiv(event));
				_events.push(ve);
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
		this._clearEvents = function(){			
			$.each(_events, function(index, val) {
				val.visual().clear();
			});

			_events = [];
		};
		
		/**
		 * TODO
		 */
		this._showTooltip = function(x, y, event){
			x = Math.round(x);
			y = Math.round(y);
			
			var $tooltip = $('<div id="tooltip" class="'+event.eventType+'"></div>').appendTo('body');
			$('<div id="title" style="font-weight:bold;">' + event.title + '</div>').appendTo($tooltip);
			$('<div id="type" style="font-style:italic;">Type: ' + event.eventType + '</div>').appendTo($tooltip);
			$('<div id="description">' + event.description + '</div>').appendTo($tooltip);
			
			$tooltip.css({
				"position": "absolute",
				"max-width": "300px",
				"border": "1px solid #666",
				"padding": "2px",
				"background-color": "#EEE",
				"z-index": "999",
				"font-size": "smaller",
				"cursor": "move"
			})
			
			var width = $tooltip.width();
			if (x+width > window.innerWidth) {
				console.log(x, width, window.innerWidth);
				x = x-width;
			}
			
			$tooltip.css({
				top: y+20,
				left: x
			}).fadeIn(200);
		};
		
		/**
		 * TODO
		 */
		this._buildDiv = function(event){
			var that = this;
			//var po = plot.pointOffset({ x: 450, y: 1});
			var container = this.plot.getPlaceholder(), o = this.plot.getPlotOffset(), yaxis, 
			xaxis = this.plot.getXAxes()[this.plot.getOptions().events.xaxis - 1], axes = this.plot.getAxes();
			
			var top, 
				left, 
				div, 
				color,
				markerSize,
				lineStyle,
				drawableEvent;
			
			// determine the y axis used
			if (axes.yaxis && axes.yaxis.used) yaxis = axes.yaxis;
			if (axes.yaxis2 && axes.yaxis2.used) yaxis = axes.yaxis2;
			
			// map the eventType to a types object
			var eventTypeId = -1;
			$.each(this._types, function(index, type){
				if (type.eventType == event.eventType) {
					eventTypeId = index;
					return false;
				}
			});
			
			if (this._types == null || !this._types[eventTypeId] || !this._types[eventTypeId].color) {
				color = '#666';
			} else {
				color = this._types[eventTypeId].color;
			}
			
			if (this._types == null || !this._types[eventTypeId] || !this._types[eventTypeId].markerSize) {
				markerSize = 5; //default marker size
			} else {
				markerSize = this._types[eventTypeId].markerSize;
			}
			
			if (this._types == null || !this._types[eventTypeId] || !this._types[eventTypeId].lineStyle) {
				lineStyle = 'dashed'; //default line style
			} else {
				lineStyle = this._types[eventTypeId].lineStyle.toLowerCase();
			}
			
			
			top = o.top + this.plot.height();
			left = xaxis.p2c(event.min) + o.left;
			
			line = $('<div class="events_line"></div>').css({
					"position": "absolute",
					"opacity": 0.8,
					"left": left + 'px',
					"top": 8,
					"width": "1px",
					"height": this.plot.height(),
					"border-left-width": "1px",
					"border-left-style": lineStyle,
					"border-left-color": color
				})
				.appendTo(container)
				.hide();
			
			marker = $('<div class="events_marker"></div>').css({
					"position": "absolute",
					"left": -markerSize-1+"px",
					"cursor": "help",
					"font-size": 0,
					"line-height": 0,
					"width": 0,
					"height": 0, 
					"border-left": markerSize+"px solid transparent",
					"border-right": markerSize+"px solid transparent"
				})
				.appendTo(line);
			
			if (this._types[eventTypeId] && this._types[eventTypeId].position && this._types[eventTypeId].position.toUpperCase() === 'BOTTOM') {
				marker.css({
					"top": top-markerSize-8 +"px",
					"border-top": "none",
					"border-bottom": markerSize+"px solid " + color,
				});
			} else {
				marker.css({
					"top": "0px",
					"border-top": markerSize+"px solid " + color,
					"border-bottom": "none"
				});
			}
			
			marker.data({
				"event": event
			});
			
			marker.hover(
				// mouseenter
				function(){
					var pos = $(this).offset();
					if (that._types[eventTypeId] && 
						that._types[eventTypeId].position && 
						that._types[eventTypeId].position.toUpperCase() === 'BOTTOM') {
						pos.top -= 150;
					}
					
					that._showTooltip(pos.left, pos.top, $(this).data("event"));
					
					if (event.min != event.max) {
						that.plot.setSelection({
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
					that.plot.clearSelection();
			});
			
			drawableEvent = new DrawableEvent(
				line,
				function drawFunc(obj) { obj.show(); },
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
		this._insidePlot = function(x) {
			var xaxis = this.plot.getXAxes()[this.plot.getOptions().events.xaxis - 1];
			var xc = xaxis.p2c(x);
			return xc > 0 && xc < xaxis.p2c(xaxis.max);
		};
	};
	
	
	function init(plot){
		var that = this;
		var marker = new Marker(plot);
		
		/*
		plot.getEvents = function(){
			return marker._events;
		};
		
		plot.hideEvents = function(){
			$.each(marker._events, function(index, event){
				event.visual().getObject().hide();
			});
		};
		
		plot.showEvents = function(){
			plot.hideEvents();
			$.each(marker._events, function(index, event){
				event.hide();
			});
			
			that.marker.drawEvents();
		};
		*/
		
		plot.hooks.processOptions.push(function(plot, options){
			// enable the plugin
			if (options.events.data != null) {
				marker.setEventsEnabled(true);
			}
		});
		
		plot.hooks.draw.push(function(plot, canvascontext){
			var options = plot.getOptions();
			var xaxis = plot.getXAxes()[options.events.xaxis - 1];
			
			if (marker.getEventsEnabled) {
				// check for first run
				if (marker.getEvents().length < 1) {
					marker.setLastRage(xaxis.max - xaxis.min);
					marker.setTypes(options.events.types);
					marker.setupEvents(options.events.data);
				} else {
					marker.updateEvents();
				}
			}
			
			marker.drawEvents();
		});
		
	}//init
	
	var defaultOptions = {
		events: {
			data: null,
			types: null,
			xaxis: 1,
			position: 'TOP'
		}
	};
	
	$.plot.plugins.push({
		init: init,
		options: defaultOptions,
		name: "events",
		version: "0.1.0"
	});
})(jQuery);
