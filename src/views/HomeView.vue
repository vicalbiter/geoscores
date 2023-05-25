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
              <b-tab title="Model Profile">

                <b-card :title="cellTitle" title-tag="h5" class="control-pane" :header="classOfInterest">
                  <b-table :items="cellInfo" :fields="fieldsMap" small v-if="cellInfo">
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

                  <div v-else class="placeholder">
                    <h2>(Click on a tract to display its profile)</h2>
                  </div>
                </b-card>

              </b-tab>

              <!-- Model -->
              <b-tab title="Niche Model">
                <b-card class="control-pane" :header="classOfInterest">
                  <b-table :items="niche" :fields="fieldsNiche" small hover>
                    <template #cell(interval)="data">{{ data.item.interval }}</template>
                    <template #cell(score)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(epsilon)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(pcx)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                    <template #cell(pc)="data">{{ Math.round(data.value * 100) / 100 }}</template>
                  </b-table>
                </b-card>

              </b-tab>
    
              <!-- Settings -->
              <b-tab title="Niche Variables">
                
                <b-card class="control-pane">

                  <template #header>
                    <b-row align-v="center" align-h="between">
                      <b-col cols="6"><b-card-text><strong>Available Niche Variables</strong> for {{ classOfInterest }}</b-card-text></b-col>
                      <b-col cols="4">
                        <b-button size="sm" @click="restyleMap" class="mr-2">Show Filters</b-button>
                        <b-button variant="info" size="sm" @click="restyleMap">Update Map</b-button>
                      </b-col>
                    </b-row>
                  </template>

                  <b-table :items="settings" :fields="fieldsSettings" small hover>
                    <!-- Taxonomy -->
                    <template #cell(taxonomy)="data">
                      <b-form-checkbox v-model="taxonomies[data.item.taxonomy].include" @input="updateSelectedTaxonomy(data.item, $event)">{{ data.item.taxonomy }}</b-form-checkbox>
                    </template>
                    <!-- Include & Name -->
                    <template #cell(include)="data">
                      <b-form-checkbox v-model="data.item.include" @input="updateSelectedDrivers(data.item, $event)">{{ data.item.name }}</b-form-checkbox>
                    </template>
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

// Fair Housing
import grid from "@/data/demo_affh_cog_tracts.json";
import dd from "@/data/demo_affh_output_dict_CG_pct_hhrent_30p_10.json";
import dd_display from "@/data/demo_affh_output_table_display_CG_pct_hhrent_30p_10.json"
import niche from "@/data/demo_affh_output_table_CG_pct_hhrent_30p_10.json"; 
var selectedClass = "CG_pct_hhrent_30p"
var selectedValue = 10
var modelClassDesc = "Rent >30% of renter's income";
var modelTitle = "Class: " + modelClassDesc + " - 10";

// import dd from "@/data/demo_affh_output_dict_CG_totPeople_5.json";
// import dd_display from "@/data/demo_affh_output_table_display_CG_totPeople_5.json"
// import niche from "@/data/demo_affh_output_table_CG_totPeople_5.json"; 
// var modelClass = "Homelessness";
// var modelTitle = "Class: " + modelClass + " - 5";

import L, { geoJson } from "leaflet";
import settings from "@/store/settings";

const Gradient = require("javascript-color-gradient");

export default {
  name: "HomeView",
  components: {},
  data() {
    return {
      selectedClass: selectedClass,
      selectedValue: selectedValue,
      classOfInterest: modelTitle,
      showClassTract: settings.state.showClassTracts,
      map: null,
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
        { key: "description", label: 'Niche Variable', thClass: 'text-left', tdClass: 'text-left' },
        { key: "value", label:'Value', sortable: true },
        { key: "score", sortable: true}
      ],
      dd_display: dd_display,
      niche: niche,
      fieldsNiche: [
        { key: "name", sortable: true },
        { key: "description", sortable: false },
        { key: "value", sortable: true },
        { key: "interval", sortable: false },
        { key: "score", sortable: true },
        { key: "epsilon", sortable: true },
        { key: "pcx", sortable: false },
        { key: "pc", sortable: false }
      ],
      settings: null,
      taxonomies: {},
      fieldsSettings: [
        { key: "taxonomy", label:"Category", sortable: true, thClass: 'text-left', tdClass: 'text-left' },
        { key: "include", label: "Name", sortable: false, thClass: 'text-left', tdClass: 'text-left' },
        // { key: "name", sortable: true },
        { key: "description", sortable: false, thClass: 'text-left', tdClass: 'text-left' }
      ],
      selectedDrivers: {},
    };
  },
  methods: {
    intializeParameters() {
      // const grid = await fetch("something...");
      this.settings = this.intializeDriverSettings(dd);
      this.taxonomies = this.intializeTaxonomies(dd);
      this.selectedDrivers = this.initializeSelectedDrivers(this.settings)
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
      })

      this.geojson.addTo(this.map);

      // Get the bounds of the current grid and zoom appropiately
      this.map.fitBounds(this.geojson.getBounds());

      // Add legend
      this.addLegend()
      this.legend.update(this.gradient)
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

      this.legend.update = function (gradient=[]) {
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
        .setColorGradient("#0000FF", "FFFFFF", "#FF0000")
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
    scoreFeature(feature) {
      // Initialize the total score of this feature
      // console.log(feature)
      var total_score = 0;

      // Get the total score of this feature
      for (var property in feature.properties) {
        if ((property in dd) && (this.selectedDrivers[property]) && feature.properties[property]) {
          // console.log({property, selected: this.selectedDrivers[property]})
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
        weight: this.getWeight(feature),
        opacity: 1,
        color: this.getBorder(feature),
        dashArray: "1",
        fillOpacity: 0.8,
      };
    },
    getColor(feature) {
      var score = this.scoreFeature(feature);
      return this.getGradientColor(score)
    },
    getBorder(feature) {
      if (this.showClassTract.status && feature.properties[selectedClass] == selectedValue) { return 'yellow' }
      else { return 'white' }
    },
    getWeight(feature) {
      if (this.showClassTract.status && feature.properties[selectedClass] == selectedValue) { return 7 }
      else { return 1 }
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
      for (var property in props) {
        // Only parse those properties that are being tracked in the data dictionary
        if ((property in dd) && (this.selectedDrivers[property])) {

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
            taxonomy: dd[property]["taxonomy"],
            description: dd[property]["description"],
            value: value,
            score: value ? this.truncate(dd[property]["values"][value]["score"]) : 0,
          });
        }
      }

      // Update the UI
      this.cellScore = 0
      items.forEach(element => { this.cellScore += element.score })
      this.cellScore = this.truncate(this.cellScore);
      // this.cellTitle = props.Field + " [Score: " + this.cellScore + " => " + this.transform(this.cellScore) + " MTH" + "]";
      this.cellTitle = "GEOID: " + props.GEOID10 + " [Score: " + this.cellScore + "]";

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
    },
    intializeDriverSettings(dict) {
      var list = [];
      for (var driver in dict) {
        var description = dict[driver]["description"]
        var taxonomy = dict[driver]["taxonomy"]

        list.push({
          name: driver, 
          description: description,
          taxonomy: taxonomy,
          include: true
        });
      }
      return list;
    },
    intializeTaxonomies(dict) {
      var taxonomies = {};
      for (var driver in dict) {
        var description = dict[driver]["description"]
        var taxonomy = dict[driver]["taxonomy"]

        if (!(taxonomy in taxonomies)) {
          taxonomies[taxonomy] = {
            include: true,
            drivers: []
          }
        }
        taxonomies[taxonomy]["drivers"].push(driver)
      }
      // console.log(taxonomies)
      return taxonomies
    },
    initializeSelectedDrivers(list) {
      var dict = {}
      for (var index in list) {
        var driver = list[index]
        dict[driver.name] = driver.include
      }
      return dict
    },
    updateSelectedDrivers(item, newValue) {
      this.selectedDrivers[item.name] = newValue
      item.include = newValue
      // console.log(`Updated ${item.name} to ${newValue}`)
      // this.restyleMap()
    },
    updateSelectedTaxonomy(item, newValue) {
      this.updateSelectedDrivers(item, newValue)
    },
    restyleMap() {
      // Update gradient
      this.gradient = this.getScoreGradient(grid.features)
      this.legend.update(this.gradient)

      // Update features
      this.geojson.eachLayer((featureInstanceLayer) => {
        this.geojson.resetStyle(featureInstanceLayer)
      })
    }
  },
  mounted() {
    this.intializeParameters();
    this.initializeMap();
    // console.log(this.selectedDrivers)
  },
};
</script>

<style>
#map {
  height: 800px;
}

.control-pane {
  height: 700px;
  overflow-y: auto;
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
