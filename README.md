# flot-events
Flot Charting Library Plugin to show Events-Markers

## Interactive Example

* [Open Demo](./example/)
* [Show example source](https://github.com/mojoaxel/flot-events/blob/master/example/index.html)

## Docs

```javascript
var types = [{
  eventType: "Info",
  color: "blue"
}, {
  eventType: "Critical",
  color: "red", // e.g red, #F00, #FF0000, [gray]
  markerSize: 10, //in px, [5]
  position: 'BOTTOM', //[TOP], BOTTOM
  lineStyle: 'solid' //dotted, [dashed], solid
}];

var events = [{
  min: 1,
  max: 1,
  eventType: "Info",
  title: "Info Event",
  description: "At position x=1 something happend!"
}, {
  min: 2,
  max: 3,
  eventType: "Critical",
  title: "Critical region",
  description: "Between x=2..3 something is critical"
}];

var plot = $.plot($('#plot'), [ data ], {
  /* this activates the events plugin and sets options */
  events: {
    data: events,
    types: types
  },
  /* optional for range highlighting; depends on jquery.flot.selection.*/
  selection: {
    color: "#e8cfac"
  },
});
```

This plugin is tested to work together with these plugins:

* jquery.flot.axislabels
* jquery.flot.canvas
* jquery.flot.downsample
* jquery.flot.tooltip
* jquery.flot.time
* jquery.flot.selection
* jquery.flot.navigate

## License

Dual licensed under [MIT](http://opensource.org/licenses/MIT) and [GPLv2](http://opensource.org/licenses/gpl-2.0.php)
This plugin is based on [Joel Oughtons](https://github.com/oughton) ["Event Graphics" plugin](http://joeloughton.com/blog/web-applications/flot-plugins-event-graphics/) from his [flot-plugin-collection](https://github.com/oughton/flot-plugin-collection) witch is also licensed under MIT and GPLv2.

## Versions

### 0.2.3
* added option "markerTooltip" with default `true`

### 0.2.2
* added option "markerShow" with default `true`
* added option "lineWidth" with default `1`

### 0.2.1
* registered with bower

### 0.2.0
* first release
