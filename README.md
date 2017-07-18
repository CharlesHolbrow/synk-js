# synk-js

Classes for connecting to a synk server.

## Entry Point

- `main: 'dist/synk.js'` transpiled to umd
- `module: 'src/index.js'` es6 classes with 'import' statements

## Webpack Usage

Note that client code that uses webpack will probably want to use a webpack rule like the one below:

``` javascript
  // We need to add .es6.js to import resolution.
  resolve: {
    extensions: [".js", ".json", ".es6.js"]
  },
  module: {
    rules: [
      // Compile client es6. Only needed if host module needs to compile es6.
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      // If we encounter a .es6.js file in node_modules, babel it. This is
      // required for host modules that use the 'module' entrypoint.
      {
        test: /node_modules.*\.es6\.js$/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
```
