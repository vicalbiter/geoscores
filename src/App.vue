<template>
  <div id="app">
    <div class="my-1">
      <b-img src="./assets/imgFdoBlancoChico.jpg" fluid alt="Responsive image" class="top-presage"></b-img>
    </div>
    <router-view/>
    <nav>
      <router-link to="/">Map</router-link> |
      <router-link to="/about">Settings</router-link>
    </nav>
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
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
  height: 80px;
}
</style>
