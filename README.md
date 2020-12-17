[![DOI](https://zenodo.org/badge/39520701.svg)](https://zenodo.org/badge/latestdoi/39520701)


# Cell Sketches

A prototype for visual summaries of connectomics data by Ethan Kerzner. I created this app for three reasons: 1) to become familiar with 
marclab data; 2) to learn AngularJS development; and 3) to create something that is potentially useful for 
neuroscientists.

Although I created it as a technology probe, this app has proved useful for analysis. I have continued to update it, but would like to see its features re-implemented in a different application. Cell Sketches should be seen as pre-alpha because I support it in my free time.

## Data

This app pulls connectome data from the [Viking OData Web Service](http://connectomes.utah.edu/export/odata.html). 

Additional volumes can be supported by editing [this list](https://github.com/kerzner/cellSketches/blob/4318ec4fd0eae5bd366879d0904158da4b693468/app.js#L57-L64).

## Development

This application uses bower and npm to manage dependencies. General instructions for development:

1. Install npm and bower globally. I've tested this with npm v. 5.6.0 and bower v. 1.8.4.
1. Clone this repository
1. Install development dependencies `npm install` followed by `bower install`
1. Start the development server with `npm start` 
1. Run unit tests with `karma start`
1. Use `/scripts/deploy.sh` to publish changes to gh-pages branch

## Application structure

I learned how to use AngularJS and OData while I was building the application. I tried to follow the [John Papa AngularJS styleguide](https://github.com/johnpapa/angular-styleguide/blob/master/a1/README.md). But, I made some bad decisions about the design that I have not gotten around to refactoring. Beware. 
