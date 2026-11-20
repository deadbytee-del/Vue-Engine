#!/bin/sh
set -e
cd "$(dirname "$0")"
cargo build --release --target wasm32-unknown-unknown --quiet
clang++ --target=wasm32 -O3 -nostdlib -fno-exceptions -fno-rtti -ffreestanding -fvisibility=hidden -c core.cpp -o core.o
wasm-ld --no-entry --gc-sections --strip-all -O3 --lto-O3 \
--export=vwr_static --export=vwr_step --export=vwr_max_static --export=vwr_max_dynamic \
--export=vwr_sx --export=vwr_sy --export=vwr_sz --export=vwr_sw --export=vwr_sh --export=vwr_sd \
--export=vwr_dx --export=vwr_dy --export=vwr_dz --export=vwr_dw --export=vwr_dh --export=vwr_dd \
--export=vwr_dvx --export=vwr_dvy --export=vwr_dvz --export=vwr_dgs --export=vwr_dgr \
core.o target/wasm32-unknown-unknown/release/libvwr_grid.a -o vwr.wasm
node gen.js
