/**
 * Created by Denis Bondarenko <bond.den@gmail.com> on 08.05.2015.
 */
'use strict';

var
  gulp    =require('gulp'),
  changed =require('gulp-changed'),
  rename  =require('gulp-rename'),
  srcmap  =require('gulp-sourcemaps'),
  babel   =require('gulp-babel'),
  mocha   =require('gulp-mocha'),
  istanbul=require('gulp-istanbul'),
  plumber =require('gulp-plumber'),
  bump    =require('gulp-bump'),
  cc      =require('cli-color'),
  todo    =require('gulp-todo')
  ;

function E(e){
  console.log(cc.red(JSON.stringify(e,null,'\t')));
}

var dftRpr={
  reporter:'spec',
  ui:      'tdd'
};

var d={
  js:  {
    src: ['src/**/*.es7.js','src/*.es7.js'],
    dst: './',
    maps:'.maps/'
  },
  tst: {
    main:'tst/index.js'
  },
  cov: {
    src:['./lib/*.js','index.js'],
    rpr:'./tst/ut-cov',
    tmp:'./tst/.tmp'
  },
  todo:{
    src:[
      './src/**/*.*',
      './src/*.*',
      './tst/*.js'
    ],
    dst:'./.todo',
    bse:'./'
  }
};

gulp.task('bld',()=>{
  return gulp
    .src(d.js.src)
    .pipe(plumber())
    .pipe(changed(d.js.dst))
    .pipe(srcmap.init())
    .pipe(babel())
    .pipe(srcmap.write(d.js.maps))
    .pipe(rename((path)=>{
      path.basename=path.basename.replace('.es7','');
    }))
    .pipe(gulp.dest(d.js.dst));
});

gulp.task('tst',['bld'],()=>{
  return gulp
    .src(d.tst.main,{read:false})
    .pipe(mocha(dftRpr))
    .once('error',(e)=>{
      E(e);
      process.exit(1);
    })
    .once('end',()=>{
      process.exit();
    });
});

gulp.task('coverage',['bld'],()=>{
  return gulp
    .src(d.cov.src)
    .pipe(istanbul({
      includeUntested:true
    }))
    .pipe(gulp.dest(d.cov.rpr))
    .on(
      'finish',
      ()=>{
        gulp
          .src(d.tst.main,{read:false})
          .pipe(istanbul
            .writeReports({
              dir:       d.cov.rpr,
              reporters: ['lcovonly','json','text','text-summary','html'],
              reportOpts:{
                lcov:          {
                  dir: d.cov.rpr,
                  file:'lcov.info'
                },
                json:          {
                  dir: d.cov.rpr,
                  file:'coverage.json'
                },
                text:          {
                  dir: d.cov.rpr,
                  file:'coverage.txt'
                },
                "text-summary":{
                  dir: d.cov.rpr,
                  file:'summary.txt'
                },
                html:          {
                  dir: d.cov.rpr,
                  file:'coverage.html'
                }
              }
            })
            .once('end',()=>{
              process.exit();
            })
          );
      }
    );
});

gulp.task('debug',['bld'],()=>{

});

gulp.task('watch',()=>{
  gulp.watch(d.js.src,['bld']);
});

gulp.task('todo',()=>{
  gulp
    .src(d.todo.src)
    .pipe(todo({
      absolute:        true,
      transformComment:(file,line,text,kind)=>{
        return ['| '+file.replace(d.todo.bse,'')+' | '+line+' | '+text];
      }
    }))
    .pipe(gulp.dest(d.todo.dst))
    .pipe(todo.reporter('json',{fileName:'todo.json'}))
    .pipe(gulp.dest(d.todo.dst));
});

gulp.task('bump',()=>{
  gulp
    .src('./package.json')
    .pipe(bump({type:'patch'}))
    .pipe(gulp.dest('./'));
});

gulp.task('default',['watch','bld']);

//aliases for backward compatibility
gulp.task('test',['tst']);
gulp.task('js',['bld']);
