var gulp = require('gulp');
var uglify = require('gulp-uglify');
var useref = require('gulp-useref');
var rename = require('gulp-rename');
var mocha = require('gulp-mocha');
var babel = require('gulp-babel');
var istanbul = require('gulp-istanbul');

gulp.task('default', function(){
  return gulp.src(['nimbly.js'])
	.pipe(useref())
	// Minifies only if it's a JavaScript file
	.pipe(uglify())
	// Add .min to the minified filename
	.pipe(rename({ suffix: '.min' }))
	// Write it to the current directory
	.pipe(gulp.dest('./'))
});

gulp.task('pre-test', function () {
	return gulp.src(['nimbly.js'])
	// Covering files
	.pipe(istanbul())
	// Force `require` to return covered files
	.pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], function() {
	return gulp.src(['test/test/test.js'])
	.pipe(mocha({compilers:babel}))
	.pipe(istanbul.writeReports());
});