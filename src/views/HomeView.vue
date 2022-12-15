<template>
  <div>
    <b-container fluid>
      <b-row>
        <!-- Map -->
        <b-col cols="6">
          <div id="map"></div>
        </b-col>

        <!-- Controls -->
        <b-col cols="6">
          
          <b-card no-body>
            <b-tabs card>
              <!-- Geo-Niche -->
              <b-tab title="Geo-Prediction">

                <b-card :title="cellTitle" title-tag="h5" class="control-pane" :header="classOfInterest">
                  <b-table :items="cellInfo" :fields="fieldsMap" small>
                    <!-- Customized field to allow data manipulation-->
                    <template #cell(value)="data">
                      <!-- <b-form-input
                        type="number"
                        :value="data.value"
                        @update="updateValue(data.item, $event)"
                        size="sm"
                        step="0.01"
                      ></b-form-input> -->
                      <b-form-select
                        :value="data.value"
                        :options="dd_display[data.item.driver]"
                        @change="updateValue(data.item, $event)"
                        size="sm"
                        class="text-center"
                      ></b-form-select>
                    </template>
                  </b-table>
                </b-card>

              </b-tab>

              <b-tab title="Niche Model">
                <b-card class="control-pane" :header="classOfInterest">
                  <b-table :items="niche" :fields="fieldsNiche" small>
                    <template #cell(interval)="data">{{ data.item.interval }}</template>
                    <template #cell(score)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(epsilon)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(pcx)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(pc)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                  </b-table>
                </b-card>
              </b-tab>

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

// 15 Minute City
// import grid from "@/data/grid_ny15m.json";
// import dd from "@/data/dd_ny15m.json";
// import niche from "@/data/niche_ny15m.json";
// var modelClass = "Class - Delta Population-10"

// Bikeways
import grid from "@/data/demo_increments_4326.json";
import dd from "@/data/demo_output_dict.json";
import dd_display from "@/data/demo_output_table_display.json"
import niche from "@/data/demo_output_table.json"; 
var modelClass = "Yield";
var modelTitle = "Class: " + modelClass + " - 10";

// Bikeways
// import grid from "@/data/grid_labike.json";
// import dd from "@/data/dd_labike.json";
// import niche from "@/data/niche_labike.json"; 
// var modelClass = "Delta Bike Accidents";
// var modelTitle = "Class: " + modelClass + " - 10";


// Fair Housing
// import grid from "@/data/grid_lafh.json";
// import dd from "@/data/dd_lafh.json";
// import niche from "@/data/niche_lafh.json";
// var modelClass = "Class - Overcrowding-10";

/* INSURANCE DEMOS */

// import grid from "@/data/grid_lainf.json";
// import dd from "@/data/dd_lainf_vb.json";
// import niche from "@/data/niche_lainf_vb.json"; 
// var modelClass = "Vehicle/Bike Accidents";
// var modelTitle = "Class: " + modelClass + " - 10";

// import grid from "@/data/grid_lainf.json";
// import dd from "@/data/dd_lainf_vp.json";
// import niche from "@/data/niche_lainf_vp.json"; 
// var modelClass = "Vehicle/Pedestrian Accidents";
// var modelTitle = "Class: " + modelClass + " - 10";

// import grid from "@/data/grid_lainf.json";
// import dd from "@/data/output_for_map.json";
// import niche from "@/data/output_for_table.json"; 
// var modelClass = "Vehicle/Vehicle Accidents";
// var modelTitle = "Class: " + modelClass + " - 10";

import L from "leaflet";
const Gradient = require("javascript-color-gradient");

export default {
  name: "HomeView",
  components: {},
  data() {
    return {
      classOfInterest: modelTitle,
      map: null,
      geojson: null,
      gradient: null,
      gradientSteps: 10,
      cellTitle: null,
      cellScore: 0,
      cellInfo: null,
      cell: null,
      sortBy: "value",
      sortDesc: true,
      fieldsMap: [
        { key: "driver", sortable: true },
        { key: "value", sortable: true },
        { key: "score", sortable: true },
      ],
      dd_display: dd_display,
      niche: niche,
      fieldsNiche: [
        { key: "name", sortable: true },
        { key: "value", label: "Category", sortable: true },
        { key: "interval", sortable: false },
        { key: "score", sortable: true },
        { key: "epsilon", sortable: true },
        { key: "pcx", sortable: false },
        { key: "pc", sortable: false }
      ]
    };
  },
  methods: {
    fetchGrid() {
      // const grid = await fetch("something...");
      this.gradient = this.getScoreGradient(grid.features);
    },
    initializeMap() {
      // Define the map
      this.map = L.map("map").setView([51.959, -8.623], 12);

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
      }).addTo(this.map);

      // Get the bounds of the current grid and zoom appropiately
      this.map.fitBounds(this.geojson.getBounds());
    },
    getScoreGradient(features) {
      // Initialize the min and max scores in this collection
      var min_score = 9999;
      var max_score = -9999;

      // Iterate through all the feature collection and get the min and max scores
      // for the gradient intervals calculation
      for (var index in features) {
        var feature = features[index];

        // Get the total score of this feature
        var total_score = this.scoreFeature(feature);

        // Update the min and max scores
        min_score = total_score < min_score ? total_score : min_score;
        max_score = total_score > max_score ? total_score : max_score;
      }

      // Get the gradient based on these min and max scores
      var steps = this.gradientSteps;
      var interval = (max_score - min_score) / steps;
      var intervals = [];

      var gradientArray = new Gradient()
        .setColorGradient("#FFFFFF", "#FF0000")
        .setMidpoint(steps + 1)
        .getColors();

      for (var i = 0; i <= steps; i++) {
        intervals.push({
          val: min_score + i * interval,
          color: gradientArray[i],
        });
      }

      return intervals;
    },
    scoreFeature(feature) {
      // Initialize the total score of this feature
      var total_score = 0;

      // Get the total score of this feature
      for (var property in feature.properties) {
        if ((property in dd) && feature.properties[property]) {
          // Get the score of this property
          var score = this.scoreProperty(
            property,
            feature.properties[property]
          );

          // Update the total score of this feature
          if (!isNaN(score)) {
            total_score += score;
          }
        }
      }

      return total_score;
    },
    scoreProperty(property, value) {

      if ((typeof(value) == 'number') & !value.toString().includes('.') & dd[property]["type"] != 'num') {
        value = value.toString() + '.0'
      }

      if(typeof(value) == 'boolean') {
        value = value.toString()
        value = value.charAt(0).toUpperCase() + value.slice(1)
      }

      return dd[property]["values"][value]["score"]

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
      var score = this.scoreFeature(feature);

      // Edge cases
      if (score < this.gradient[0].val) {
        return this.gradient[0].color;
      } else if (score >= this.gradient[this.gradientSteps].val) {
        return this.gradient[this.gradientSteps].color;
      }

      for (var i = 0; i < this.gradientSteps; i++) {
        if (score >= this.gradient[i].val && score < this.gradient[i + 1].val) {
          return this.gradient[i].color;
        }
      }
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

      // this.cell = e.target.feature;
      // this.cellInfo = this.parseProperties(e.target.feature.properties);
    },
    resetHighlight(e) {
      this.geojson.resetStyle(e.target);
    },
    focusOnFeature(e) {
      console.log(e)
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
      for (var property in props) {
        // Only parse those properties that are being tracked in the data dictionary
        if (property in dd) {

          var value = props[property]

          if (value) {
            if ((typeof(value) == 'number') & !value.toString().includes('.') & dd[property]["type"] != 'num') {
              value = value.toString() + '.0'
            }

            if(typeof(value) == 'boolean') {
              value = value.toString()
              value = value.charAt(0).toUpperCase() + value.slice(1)
            }
          }


          items.push({
            driver: property,
            value: value,
            score: value ? this.truncate(dd[property]["values"][value]["score"]) : 0,
          });
        }
      }

      // Update the UI
      this.cellScore = 0
      items.forEach(element => { this.cellScore += element.score })
      this.cellScore = this.truncate(this.cellScore);
      this.cellTitle = props.Field + " [Score: " + this.cellScore + " => " + this.transform(this.cellScore) + " MTH" + "]";
      // this.cellTitle = props.name + " [Score: " + this.cellScore + "]";

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
      // if (modelClass == "Vehicle/Bike Accidents") {
      //   return this.truncate(2.22*Math.exp(0.2028 * value))
      // } else if (modelClass == "Vehicle/Pedestrian Accidents") {
      //   return this.truncate(4.2273*Math.exp(0.1732 * value))
      // } else if (modelClass == "Vehicle/Vehicle Accidents") {
      //   return this.truncate(34.366*Math.exp(0.1075 * value))
      // }
      return this.truncate(95.61*Math.exp(0.008*value))
    }
  },
  mounted() {
    this.fetchGrid();
    this.initializeMap();
  },
};
</script>

<style>
#map {
  height: 800px;
}

.control-pane {
  height: 700px;
  overflow-y: scroll;
  font-size: 12px;
}
</style>
