import gulp from "gulp";
import ts from "gulp-typescript";

const tsConfig = ts.createProject("tsconfig.json");

const tsBundle = () =>
    gulp
        .src("src/categoriesScript.ts")
        .pipe(tsConfig())
        .js.pipe(gulp.dest("build/"));
export const build = gulp.series([tsBundle]);
