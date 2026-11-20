#![no_std]
use core::panic::PanicInfo;
#[panic_handler]
fn panic(_: &PanicInfo) -> ! { loop {} }
const TABLE: usize = 1 << 18;
const MASK: usize = TABLE - 1;
const MAX_ENTRIES: usize = 1 << 20;
const MAX_STATIC: usize = 1 << 17;
static mut KEYS: [i64; TABLE] = [0; TABLE];
static mut HEAD: [i32; TABLE] = [0; TABLE];
static mut TAIL: [i32; TABLE] = [0; TABLE];
static mut USED: [u32; TABLE] = [0; TABLE];
static mut ENT_IDX: [u32; MAX_ENTRIES] = [0; MAX_ENTRIES];
static mut ENT_NEXT: [i32; MAX_ENTRIES] = [0; MAX_ENTRIES];
static mut STAMP: [u32; MAX_STATIC] = [0; MAX_STATIC];
static mut GEN: u32 = 1;
static mut QGEN: u32 = 1;
static mut NENT: usize = 0;
static mut CELL: f64 = 128.0;
const DENSE: usize = 1 << 20;
static mut DHEAD: [i32; DENSE] = [0; DENSE];
static mut DTAIL: [i32; DENSE] = [0; DENSE];
static mut DUSED: [u32; DENSE] = [0; DENSE];
static mut DMODE: bool = false;
static mut GX0: i64 = 0;
static mut GY0: i64 = 0;
static mut GW: i64 = 0;
static mut GH: i64 = 0;
#[inline(always)]
fn key(cx: i64, cy: i64) -> i64 { (cx << 32) ^ (cy & 0xffff_ffff) }
#[inline(always)]
fn slot(k: i64) -> usize {
    let mut h = k as u64;
    h ^= h >> 33;
    h = h.wrapping_mul(0xff51afd7ed558ccd);
    h ^= h >> 33;
    (h as usize) & MASK
}
#[inline(always)]
unsafe fn find(k: i64, insert: bool) -> isize {
    let mut s = slot(k);
    loop {
        if USED[s] != GEN {
            if !insert { return -1; }
            USED[s] = GEN;
            KEYS[s] = k;
            HEAD[s] = -1;
            TAIL[s] = -1;
            return s as isize;
        }
        if KEYS[s] == k { return s as isize; }
        s = (s + 1) & MASK;
    }
}
#[no_mangle]
pub unsafe extern "C" fn vwr_grid_build(n: u32, x: *const f64, y: *const f64, w: *const f64, h: *const f64, cell: f64) -> u32 {
    GEN = GEN.wrapping_add(1);
    if GEN == 0 { GEN = 1; USED = [0; TABLE]; DUSED = [0; DENSE]; }
    NENT = 0;
    CELL = cell;
    let n = if (n as usize) > MAX_STATIC { MAX_STATIC } else { n as usize };
    let mut mx0 = i64::MAX; let mut my0 = i64::MAX; let mut mx1 = i64::MIN; let mut my1 = i64::MIN;
    for i in 0..n {
        let cx = *x.add(i); let cy = *y.add(i); let hw = *w.add(i) * 0.5; let hh = *h.add(i) * 0.5;
        let a = libm_floor((cx - hw) / cell) as i64; let b = libm_floor((cx + hw) / cell) as i64;
        let c = libm_floor((cy - hh) / cell) as i64; let d = libm_floor((cy + hh) / cell) as i64;
        if a < mx0 { mx0 = a; } if b > mx1 { mx1 = b; } if c < my0 { my0 = c; } if d > my1 { my1 = d; }
    }
    DMODE = n > 0 && (mx1 - mx0 + 1) > 0 && (my1 - my0 + 1) > 0 && ((mx1 - mx0 + 1) as u64) * ((my1 - my0 + 1) as u64) <= DENSE as u64;
    if DMODE { GX0 = mx0; GY0 = my0; GW = mx1 - mx0 + 1; GH = my1 - my0 + 1; }
    for i in 0..n {
        let cx = *x.add(i); let cy = *y.add(i); let hw = *w.add(i) * 0.5; let hh = *h.add(i) * 0.5;
        let x0 = libm_floor((cx - hw) / cell) as i64; let x1 = libm_floor((cx + hw) / cell) as i64;
        let y0 = libm_floor((cy - hh) / cell) as i64; let y1 = libm_floor((cy + hh) / cell) as i64;
        let mut gx = x0;
        while gx <= x1 {
            let mut gy = y0;
            while gy <= y1 {
                if NENT >= MAX_ENTRIES { return NENT as u32; }
                ENT_IDX[NENT] = i as u32;
                ENT_NEXT[NENT] = -1;
                if DMODE {
                    let s = ((gy - GY0) * GW + (gx - GX0)) as usize;
                    if DUSED[s] != GEN { DUSED[s] = GEN; DHEAD[s] = -1; DTAIL[s] = -1; }
                    if DTAIL[s] < 0 { DHEAD[s] = NENT as i32; } else { ENT_NEXT[DTAIL[s] as usize] = NENT as i32; }
                    DTAIL[s] = NENT as i32;
                } else {
                    let s = find(key(gx, gy), true) as usize;
                    if TAIL[s] < 0 { HEAD[s] = NENT as i32; } else { ENT_NEXT[TAIL[s] as usize] = NENT as i32; }
                    TAIL[s] = NENT as i32;
                }
                NENT += 1;
                gy += 1;
            }
            gx += 1;
        }
    }
    NENT as u32
}
#[no_mangle]
pub unsafe extern "C" fn vwr_grid_query(x0: f64, y0: f64, x1: f64, y1: f64, out: *mut u32, cap: u32) -> u32 {
    QGEN = QGEN.wrapping_add(1);
    if QGEN == 0 { QGEN = 1; STAMP = [0; MAX_STATIC]; }
    let c = CELL;
    let a0 = libm_floor(x0 / c) as i64; let a1 = libm_floor(x1 / c) as i64;
    let b0 = libm_floor(y0 / c) as i64; let b1 = libm_floor(y1 / c) as i64;
    let mut n: u32 = 0;
    if DMODE {
        let xa = if a0 < GX0 { GX0 } else { a0 }; let xb = if a1 > GX0 + GW - 1 { GX0 + GW - 1 } else { a1 };
        let ya = if b0 < GY0 { GY0 } else { b0 }; let yb = if b1 > GY0 + GH - 1 { GY0 + GH - 1 } else { b1 };
        let mut gx = xa;
        while gx <= xb {
            let mut gy = ya;
            while gy <= yb {
                let s = ((gy - GY0) * GW + (gx - GX0)) as usize;
                if DUSED[s] == GEN {
                    let mut e = DHEAD[s];
                    while e >= 0 {
                        let idx = ENT_IDX[e as usize];
                        if STAMP[idx as usize] != QGEN {
                            STAMP[idx as usize] = QGEN;
                            if n < cap { *out.add(n as usize) = idx; n += 1; }
                        }
                        e = ENT_NEXT[e as usize];
                    }
                }
                gy += 1;
            }
            gx += 1;
        }
        return n;
    }
    let mut gx = a0;
    while gx <= a1 {
        let mut gy = b0;
        while gy <= b1 {
            let s = find(key(gx, gy), false);
            if s >= 0 {
                let mut e = HEAD[s as usize];
                while e >= 0 {
                    let idx = ENT_IDX[e as usize];
                    if STAMP[idx as usize] != QGEN {
                        STAMP[idx as usize] = QGEN;
                        if n < cap { *out.add(n as usize) = idx; n += 1; }
                    }
                    e = ENT_NEXT[e as usize];
                }
            }
            gy += 1;
        }
        gx += 1;
    }
    n
}
#[inline(always)]
fn libm_floor(v: f64) -> f64 {
    let t = v as i64 as f64;
    if t > v { t - 1.0 } else { t }
}
