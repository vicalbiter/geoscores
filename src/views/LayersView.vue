<template>
  <div>
    <b-container fluid>
      <b-row>
        <!-- Map -->
        <b-col cols="6">
          <div id="layers-map"></div>
        </b-col>

        <!-- Controls -->
        <b-col cols="6">
          
          <b-card no-body>
            
            <b-tabs card>

              <!-- Model -->
              <b-tab title="Layer Selection">
                
                <b-card class="control-pane">

                  <template #header>
                    <b-row align-v="center" align-h="end">
                      <b-col cols="12"><b-card-text>COG Data Layers</b-card-text></b-col>
                      <!-- <b-col cols="4"><b-button variant="info" size="sm" @click="restyleMap"> Update Map</b-button></b-col> -->
                    </b-row>
                  </template>

                  <b-table :items="settings" :fields="fieldsSettings" small hover>
                    <!-- Actions -->
                    <template #cell(actions)="data">
                      <b-button size="sm" variant="info" pill @click="restyleMap(data.item)">Show</b-button>
                    </template>
                  </b-table>

                </b-card>

              </b-tab>
            
              <!-- Geo-Niche -->
              <!-- <b-tab title="Tract Profile">

                <b-card :title="cellTitle" title-tag="h5" class="control-pane">
                  <b-table :items="cellInfo" :fields="fieldsMap" small v-if="cellInfo"></b-table>
                  <div v-else class="placeholder">
                    <h2>(Click on a tract to display its profile)</h2>
                  </div>
                </b-card>

              </b-tab> -->

            </b-tabs>
          </b-card>
        </b-col>
        
      </b-row>
    </b-container>
  </div>
</template>

<script>
// @ is an alias to /src
import "leaflet/dist/leaflet.css";

// Fair Housing
import grid from "@/data/demo_affh_cog_tracts.json";
import dd from "@/data/demo_affh_output_dict_CG_pct_hhrent_30p_5.json";
import dd_display from "@/data/demo_affh_output_table_display_CG_pct_hhrent_30p_5.json"
import niche from "@/data/demo_affh_output_table_CG_pct_hhrent_30p_5.json"; 
var modelClass = "Race Composition";
var modelTitle = "Class: " + modelClass + " - 1";

import L, { geoJson } from "leaflet";
const Gradient = require("javascript-color-gradient");

export default {
  name: "HomeView",
  components: {},
  data() {
    return {
      classOfInterest: modelTitle,
      map: null,
      legend: null,
      info: null,
      geojson: null,
      gradient: null,
      gradientSteps: 9,
      cellTitle: null,
      cellScore: 0,
      cellInfo: null,
      cell: null,
      sortBy: "value",
      sortDesc: true,
      fieldsMap: [
        { key: "taxonomy", label: 'Category', sortable: true, thClass: 'text-left', tdClass: 'text-left' },
        { key: "driver", label: 'Variable', sortable: true, thClass: 'text-left', tdClass: 'text-left' },
        { key: "description", thClass: 'text-left', tdClass: 'text-left' },
        { key: "value", label:'Value', sortable: true },
      ],
      selectedProperty: 'pct_overcr',
      settings: null,
      fieldsSettings: [
        { key: "taxonomy", label: "Category", sortable: true, thClass: 'text-left', tdClass: 'text-left' },
        { key: "label", label: 'Layer Name', sortable: false, thClass: 'text-left', tdClass: 'text-left' },
        // { key: "name", sortable: true },
        { key: "description", sortable: false, thClass: 'text-left', tdClass: 'text-left' },
        { key: "actions", sortable: false}
      ],
      selectedDrivers: {},
    };
  },
  methods: {
    intializeParameters() {
      // const grid = await fetch("something...");
      this.settings = this.intializeDriverSettings(dd);
      this.selectedDrivers = this.initializeSelectedDrivers(this.settings)
      this.selectedProperty = 'pct_overcr'
      this.gradient = this.getGradient(grid.features, this.selectedProperty);
    },
    initializeMap() {
      // Define the map
      this.map = L.map("layers-map").setView([51.959, -8.623], 12);

      // Add the basemap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Add the data to the map
      this.geojson = L.geoJson(grid, {
        style: this.style,
        onEachFeature: this.onEachFeature
      })
      this.geojson.addTo(this.map);

      // Get the bounds of the current grid and zoom appropiately
      this.map.fitBounds(this.geojson.getBounds());

      // Add info
      this.addInfo()
      this.info.update(this.selectedProperty)

      // Add legend
      this.addLegend()
      this.legend.update(this.selectedProperty, this.gradient)

    },
    addInfo() {
      this.info = L.control();

      this.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      this.info.update = function (selectedProperty) {
          this._div.innerHTML = `<h5>Layer: <b>${selectedProperty}</b></h5>`;
      };

      this.info.addTo(this.map);
    },
    addLegend() {

      this.legend = L.control({position: 'bottomright'})

      this.legend.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info legend')
        this.update()
        return this._div;
      }

      this.legend.truncate = this.truncate
      this.legend.getGradientColor = this.getGradientColor

      this.legend.update = function (selectedProperty, gradient=[]) {
        // var grades = [0, 10, 20, 50, 100, 200, 500, 1000]
        var grades = gradient

        // Reset div
        // this._div.innerHTML = `${selectedProperty} <br>`
        this._div.innerHTML = ''

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
          this._div.innerHTML +=
              '<i style="background:' + this.getGradientColor(grades[i].val) + '"></i> ' +
              this.truncate(grades[i].val) + (grades[i + 1] ? ' &ndash; ' + this.truncate(grades[i + 1].val) + '<br>' : '+');
        }
      }

      this.legend.addTo(this.map);
    },
    getGradient(features, propertyName) {
      // Initialize the min and max scores in this collection
      var min_value = 9999;
      var max_value = -9999;

      // Iterate through all the feature collection and get the min and max values
      // for the gradient intervals calculation
      for (var index in features) {
        var feature = features[index];

        // Get the value of this feature based on the queried property
        var total_score = this.getFeatureValue(feature, propertyName);

        // Update the min and max values
        min_value = total_score < min_value ? total_score : min_value;
        max_value = total_score > max_value ? total_score : max_value;
      }

      // Get the gradient based on these min and max scores
      var steps = this.gradientSteps;
      var interval = (max_value - min_value) / steps;
      var intervals = [];

      var gradientArray = new Gradient()
        // .setColorGradient("#0000FF", "FFFFFF", "#FF0000")
        .setColorGradient("#0000FF", "FF0000")
        .setMidpoint(steps + 1)
        .getColors();

      for (var i = 0; i <= steps; i++) {
        intervals.push({
          val: min_value + i * interval,
          color: gradientArray[i],
        });
      }

      return intervals;
    },
    getGradientColor(value) {
      // Edge cases
      if (value < this.gradient[0].val) {
        return this.gradient[0].color;
      } else if (value >= this.gradient[this.gradientSteps].val) {
        return this.gradient[this.gradientSteps].color;
      }

      for (var i = 0; i < this.gradientSteps; i++) {
        if (value >= this.gradient[i].val && value < this.gradient[i + 1].val) {
          return this.gradient[i].color;
        }
      }
    },
    getFeatureValue(feature, property) {
      return feature.properties[property]
    },
    style(feature) {
      return {
        fillColor: this.getColor(feature),
        weight: 1,
        opacity: 1,
        color: 'white',
        dashArray: "1",
        fillOpacity: 0.8,
      };
    },
    getColor(feature) {
      var value = this.getFeatureValue(feature, this.selectedProperty);
      return this.getGradientColor(value)
    },
    onEachFeature(feature, layer) {
      layer.on({
        mouseover: this.highlightFeature,
        mouseout: this.resetHighlight,
        click: this.focusOnFeature,
      });
    },
    highlightFeature(e) {
      var layer = e.target;

      layer.setStyle({
        weight: 5,
        color: "#666",
        dashArray: "",
        fillOpacity: 0.7,
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }

      var value = this.truncate(e.target.feature.properties[this.selectedProperty])
      layer.bindTooltip(value.toString()).openTooltip()

    },
    resetHighlight(e) {
      this.geojson.resetStyle(e.target);
    },
    focusOnFeature(e) {
      // console.log(e)
      var layer = e.target;

      layer.setStyle({
        weight: 5,
        color: "#ffc107",
        dashArray: "",
        fillOpacity: 0.8,
      });

      this.cell = e.target;
      this.cellInfo = this.parseProperties(e.target.feature.properties);
      this.map.fitBounds(e.target.getBounds());
    },
    parseProperties(props) {
      var items = [];
      for (var property_ in props) {
        if ((property_ in dd)) {

          var property = property_.replace('CG_', '')
          var value = this.truncate(props[property])

          items.push({
            driver: property,
            taxonomy: dd[property_]["taxonomy"],
            description: dd[property_]["description"],
            value: value
          });
        }
      }

      // Update the UI
      this.cellTitle = `GEOID: ${props.GEOID10}`

      return items;
    },
    updateValue(item, newData) {
      // console.log({
      //   previousValue: this.cell.properties[item.driver],
      //   nextValue: newData
      // })
      this.cell.feature.properties[item.driver] = newData;
      this.cellInfo = this.parseProperties(this.cell.feature.properties);
      this.geojson.resetStyle(this.cell);
    },
    truncate(value) {
        return Math.round(value * 100) / 100;
    },
    transform(value) {
      return this.truncate(95.61*Math.exp(0.008*value))
    },
    intializeDriverSettings(dict) {
      var list = [];
      for (var driver in dict) {
        var description = dict[driver]["description"]
        var taxonomy = dict[driver]["taxonomy"]

        list.push({
          name: driver,
          label: driver.replace('CG_', ''), 
          description: description,
          taxonomy: taxonomy,
          include: true
        });
      }
      return list;
    },
    initializeSelectedDrivers(list) {
      var dict = {}
      for (var index in list) {
        var driver = list[index]
        dict[driver.name] = driver.include
      }
      return dict
    },
    restyleMap(item, e) {
      // Update gradient
      this.selectedProperty = item["label"]
      this.info.update(this.selectedProperty)
      this.gradient = this.getGradient(grid.features, this.selectedProperty)
      this.legend.update(this.selectedProperty, this.gradient)

      // Update features
      this.geojson.eachLayer((featureInstanceLayer) => {
        this.geojson.resetStyle(featureInstanceLayer)
      })
    }
  },
  mounted() {
    this.intializeParameters();
    this.initializeMap();
    // console.log(dd)
    // console.log(this.selectedDrivers)
  },
};
</script>

<style>
#layers-map {
  height: 800px;
}

.control-pane {
  height: 700px;
  overflow-y: scroll;
  font-size: 12px;
}

.info {
    padding: 6px 8px;
    font: 14px/16px Arial, Helvetica, sans-serif;
    background: white;
    background: rgba(255,255,255,0.8);
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
    border-radius: 5px;
}

.info h4 {
    margin: 0 0 5px;
    color: #777;
}

.legend {
    text-align: left;
    line-height: 18px;
    color: #555;
}

.legend i {
    width: 18px;
    height: 18px;
    float: left;
    margin-right: 8px;
    opacity: 0.7;
}

.placeholder {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0.5;
  background: #F8F8F8;
  border-radius: 10px;
}
</style>
