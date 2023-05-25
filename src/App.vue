<template>
  <div id="app">
    <b-navbar toggleable="sm" variant="light" type="light">
      <div class="nav-container">

        <b-navbar-brand>
          <h4><img src="./assets/lupa.png" class="d-inline-block align-top logo" alt=""> Smart <strong>City</strong> Planning</h4>
          <!-- <b-icon icon="building"></b-icon>  -->
        </b-navbar-brand>
        
        <b-navbar-nav class="ml-3">
          <b-nav-item to="/" exact exact-active-class="active">Model</b-nav-item>
          <b-nav-item to="/layers" exact exact-active-class="active">Layers</b-nav-item>
          <b-nav-item to="/profile" exact exact-active-class="active">Profiles</b-nav-item>
        </b-navbar-nav>
        
        <b-navbar-nav class="ml-auto">
          <b-nav-item-dropdown right>
            <!-- Using 'button-content' slot -->
            <template #button-content>
              <b-icon icon="person-circle" class="mr-1"></b-icon><small>Administrator</small>
            </template>
            <b-dropdown-item href="#">Profile</b-dropdown-item>
            <b-dropdown-item href="#">Sign Out</b-dropdown-item>
          </b-nav-item-dropdown>

          <!-- Settings -->
          <b-nav-item>
            <b-icon icon="gear" v-b-modal.settings-modal></b-icon>
          </b-nav-item>
        </b-navbar-nav>

        <b-modal id="settings-modal" title="Settings">
          <b-form-checkbox v-model="isChecked" @change="toggleClassTracts">
            Show Class Tracts
          </b-form-checkbox>
        </b-modal>

      </div>
    </b-navbar>

    <div class="content">
      <router-view/>
    </div>
    <div class="mt-3 p-2">
      <hr class="m-0 footer mx-auto">
      <b-img src="./assets/imgSinFdoParaBlancoChico.png" fluid alt="Responsive image" class="top-presage"></b-img>
      <!-- <b-img src="./assets/ibi.jpg" fluid class="top-presage"></b-img> -->
    </div>
  </div>
</template>

<script>
import settings from '@/store/settings'

export default {
  data() {
    return {
      isChecked: false,
      showClassTracts: settings.state.showClassTracts
    }
  },
  methods: {
    toggleClassTracts() {
      settings.setClassTracts(this.isChecked)
    }
  }
}

</script>

<style lang="scss">
@import "../custom.scss";

#app {
  font-family: Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

nav {
  padding: 30px;
}

nav a {
  font-weight: bold;
  color: #2c3e50;
}

nav a.router-link-exact-active {
  color: #4262b9;
}

.top-presage {
  height: 50px;
  opacity: 0.8;
}

.footer {
  width: 60%;
  opacity: 0.7;
}

.nav-container {
  display: flex;
  width: 100%;
  /* max-width: 1400px; */
  padding: 10px 20px;
  margin-left: auto;
  margin-right: auto;
}

.router-link-active {
  color: rgba(0,0,0,.9);
  border-bottom: 2px solid #3d3b3b;
}

.logo {
  max-height: 30px;
}
</style>
