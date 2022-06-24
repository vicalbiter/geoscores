<template>
  <div>
    <b-container fluid>
      <b-row>
        <!-- Map -->
        <b-col cols="7">
          <div id="map"></div>
        </b-col>

        <!-- Controls -->
        <b-col cols="5">
          <b-card :title="cellTitle" title-tag="h5" class="control-pane" :header="classOfInterest">
            <b-table :items="cellInfo" :fields="fields" small>
              <!-- Customized field to allow data manipulation-->
              <template #cell(value)="data">
                <b-form-input
                  type="number"
                  :value="data.value"
                  @update="updateValue(data.item, $event)"
                  size="sm"
                  step="0.01"
                ></b-form-input>
              </template>
            </b-table>
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
import grid from "@/data/grid_ny15m.json";
import dd from "@/data/output_for_map.json";

// Bikeways
// import grid from "@/data/grid.json";
// import dd from "@/data/dd.json";

// Fair Housing
// import grid from "@/data/grid_lafh.json";
// import dd from "@/data/dd_lafh.json";

import L from "leaflet";
const Gradient = require("javascript-color-gradient");

export default {
  name: "HomeView",
  components: {},
  data() {
    return {
      classOfInterest: "Class - Delta Population-10",
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
      fields: [
        { key: "driver", sortable: true },
        { key: "description", sortable: false},
        { key: "value", sortable: true },
        { key: "cg", label: "Bin", sortable: false },
        { key: "interval", sortable: false},
        { key: "score", sortable: true },
      ],
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
      // Initialize the score
      var score = 0;

      // Get the cg for this property
      var cg = null;

      // Look for the appropriate score in the data dictionary
      // TODO: Take care of the intervals bug (the reason for the 0.999 and 1.001 coefficients)
      var abs_min = { value: 9999, cat: null };
      var abs_max = { value: -9999, cat: null };

      for (var category in dd[property]) {

        let min = dd[property][category]["min"];
        let max = dd[property][category]["max"];

        if (min < abs_min.value) {
          abs_min.value = min;
          abs_min.cat = category
        }

        if (max > abs_max.value) {
          abs_max.value = max;
          abs_max.cat = category;
        }

        if (value >= min * 0.999 && value <= max * 1.001) {
          cg = category;
          break;
        }
      }

      if (!cg) {
        if (value < abs_min.value) { cg = abs_min.cat }
        else if (value > abs_max.value) { cg = abs_max.cat }
        else { cg = "1" }
      }
      

      return dd[property][cg]["score"];
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
      } else if (score >= this.gradient[this.gradientSteps]) {
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
          // Get the value of this property
          var value = props[property];

          // Get the cg for this property
          var cg = null;
          var min;
          var max;

          var abs_min = { value: 9999, cat: null } ;
          var abs_max = { value: -9999, cat: null };

          for (var category in dd[property]) {
            min = dd[property][category]["min"];
            max = dd[property][category]["max"];

            if (min < abs_min.value) {
              abs_min.value = min;
              abs_min.cat = category
            }

            if (max > abs_max.value) {
              abs_max.value = max;
              abs_max.cat = category;
            }

            if (value >= min && value <= max * 1.001) {
              cg = category;
              break;
            }
          }

          if (!cg) {
            if (value < abs_min.value) { cg = abs_min.cat }
            else if (value > abs_max.value) { cg = abs_max.cat }
            else { cg = "5" }
          }

          items.push({
            driver: property,
            value: this.truncate(value),
            description: dd[property][category]["description"],
            cg: cg,
            interval: " (" + this.truncate(min) + " - " + this.truncate(max) + ")",
            score: isNaN(dd[property][cg]["score"]) ? 0 : this.truncate(dd[property][cg]["score"]),
          });
        }
      }

      // Update the UI
      this.cellScore = 0
      items.forEach(element => { this.cellScore += element.score })
      this.cellScore = this.truncate(this.cellScore);
      this.cellTitle = "(NBHD) " + props.ntaname + " [Score = " + this.cellScore + "]";

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
  height: 800px;
  overflow-y: scroll;
  font-size: 12px;
}
</style>
