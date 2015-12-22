// Gulp tools
var gulp = require('gulp');
var u = require('gulp-util');
var log = u.log;
var c = u.colors;

// Project deps
var nodemon = require('gulp-nodemon');
var sass = require('gulp-sass');
var prefix = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var bs = require('browser-sync');
var reload = bs.reload;

// -----------------------------------------------------------------------------
// Sass Task
//
// Compiles Sass and runs the CSS through autoprefixer.
// -----------------------------------------------------------------------------
gulp.task('sass', function() {
  bs.notify('<span style="color: grey">Running:</span> Sass task');
  return gulp.src('sass/**/*.scss')
    .pipe(sass({
        outputStyle: 'nested',
      })
      .on('error', function(err, res) {
        log(c.red('sass'), 'failed to compile');
        log(c.red('> ') + err.message);
        bs.notify('<span style="color: red">Sass failed to compile</span>');
      })
    )
    .pipe(prefix('last 2 versions', '> 1%'))
    .pipe(gulp.dest('_public/css'))
    .pipe(reload({stream:true}));
});

// -----------------------------------------------------------------------------
// Browser Sync
// -----------------------------------------------------------------------------
gulp.task('bs', function() {
  bs({
    proxy: 'localhost:8080',
    files: 'css/*.css',
    ghostMode: false // ghostMode is incompatible with bustashape's socket data.
  });
});

// -----------------------------------------------------------------------------
// JS task
// -----------------------------------------------------------------------------
gulp.task('js', function() {
  return gulp.src([
    'js/hammer.min.js',
    'js/utils.js',
    'js/socket.js',
    'js/client.js',
  ])
  .pipe(concat('all.min.js'))
  .pipe(uglify())
  .pipe(gulp.dest('_public/js'));
});

// -----------------------------------------------------------------------------
// Build all the assets
// -----------------------------------------------------------------------------
gulp.task('build', ['sass', 'js']);

// -----------------------------------------------------------------------------
// Watch tasks
// -----------------------------------------------------------------------------
gulp.task('watch', function() {
  gulp.watch('sass/**/*', ['sass']);
  gulp.watch('js/**/*', ['js']);
});

// -----------------------------------------------------------------------------
// Run the dev server
// -----------------------------------------------------------------------------
gulp.task('start', ['sass', 'js', 'watch', 'bs'], function () {
  nodemon({
    script: 'index.js',
    ext: 'js html dust',
    env: { 'NODE_ENV': 'development' }
  });
});

// -----------------------------------------------------------------------------
// Default should just start the server
// -----------------------------------------------------------------------------
gulp.task('default', ['start']);
