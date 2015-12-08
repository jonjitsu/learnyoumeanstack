'use strict';

var gulp = require('gulp'),
    Builder = require('systemjs-builder'),
    del = require('del'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    replace = require('gulp-replace'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    browserSync = require('browser-sync').create(),
    minifyCss = require('gulp-minify-css'),
    concatCss = require('gulp-concat-css'),
    size = require('gulp-size'),
    util = require('gulp-util'),
    eslint = require('gulp-eslint');

gulp.task('default', ['build']);

gulp.task('build', [ 'lint', 'clean', 'html', 'css', 'fonts', 'scripts' ]);

gulp.task('clean', function () {
    del.sync([
        'public/**/*'
    ]);
});

gulp.task('lint', function(){
    var options = {
        configFile: 'eslint.yml'
    };
    return gulp.src(['src/js/**/*.js'])
        .pipe(eslint(options))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('html', function () {
    return gulp.src(['src/*.html'])
        .pipe(gulp.dest('public/'));
});

gulp.task('css', function () {
    return gulp.src('src/css/**/*.css', { base: 'src/css' })
        .pipe(concatCss('styles.css'))
        .pipe(gulp.dest('public/css'))
        .pipe(concatCss('styles.min.css'))
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(gulp.dest('public/css'));
});

gulp.task('scripts', function() {
    gulp.src(['node_modules/angular/angular.*'])
        .pipe(gulp.dest('public/vendor/angular/'));
    return gulp.src('src/js/**/*.js', {base: 'src/js'})
        .pipe(gulp.dest('public/js'))
        .pipe(sourcemaps.init())
        .pipe(concat('app.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('public/js'));
});

gulp.task('fonts', function() {

    return gulp.src('node_modules/font-awesome/fonts/**/*')
        .pipe(gulp.dest('public/vendor/font-awesome/fonts/'));
    
});


gulp.task('serve', ['build'], function () {

    browserSync.init({
        server: "./public",
        files: ['public/**/*'],
        open: false
    });

    gulp.watch('src/js/*.js', ['scripts']);
    gulp.watch('src/css/*.css', ['css']);
    gulp.watch('src/*.html', ['html']);
});

gulp.task('test', function() {
    util.log('@TODO');
});

