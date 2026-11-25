<?php
/**
 * Plugin Name:       RCVDA VCSE Sector
 * Description:       "State of the Sector" living dashboard. Renders the Tees Valley registered-VCSE sector as a weekly-updated time series plus detailed current-snapshot analytics (by type, legal structure, decade founded, income/turnover, size, concentration, digital, projection, ten largest) via the [rcvda_vcse_sector] shortcode — read live from the public open-data repo over the jsDelivr CDN, with automatic fallback to a bundled copy. Headline measure is based-in (registered office in the borough). Data lives in rcvda/tees-valley-vcse-sector.
 * Version:           0.4.7
 * Author:            RCVDA
 * License:           GPL-2.0-or-later
 * Text Domain:       rcvda-vcse-sector
 * Update URI:        https://github.com/rcvda/rcvda-vcse-sector
 * Primary Branch:    main
 * Release Asset:     true
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'RCVDA_VCSE_SECTOR_VER', '0.4.7' );
define( 'RCVDA_VCSE_SECTOR_URL', plugin_dir_url( __FILE__ ) );
define( 'RCVDA_VCSE_SECTOR_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Default git ref (branch or release tag) used to build the live jsDelivr URLs.
 *
 * The data repo appends new points weekly on `main`, so 'main' is the right
 * default; jsDelivr caches a branch for up to ~12h, well inside the weekly
 * cadence. Override per-dashboard with the `ref` shortcode attribute, or
 * globally with the `rcvda_vcse_sector_ref` filter.
 */
function rcvda_vcse_sector_default_ref() {
	return apply_filters( 'rcvda_vcse_sector_ref', 'main' );
}

/**
 * Registry of datasets this dashboard can render, keyed by a short slug.
 *
 * Each entry names a PUBLIC GitHub repo and the paths, within it, to the counts
 * spine (the over-time CSV) and the analytics aggregates (the snapshot-detail
 * JSON). Add more datasets (e.g. a North East series) with the
 * `rcvda_vcse_sector_datasets` filter — no change to this file needed.
 */
function rcvda_vcse_sector_datasets() {
	$datasets = array(
		'tees-valley' => array(
			'repo'  => 'rcvda/tees-valley-vcse-sector',
			'path'  => 'data/tees-valley-vcse-timeseries.csv',
			'agg'   => 'data/tees-valley-vcse-aggregates.json',
			'label' => 'Tees Valley',
		),
	);
	return apply_filters( 'rcvda_vcse_sector_datasets', $datasets );
}

/**
 * Build a jsDelivr CDN URL for a repo file at a given ref.
 *
 * jsDelivr mirrors public GitHub repos from a CDN with permissive CORS — the
 * correct way to reference a repo file from a production front end.
 * (raw.githubusercontent.com is not a CDN, rate-limits, and is not meant for
 * production traffic.)
 */
function rcvda_vcse_sector_cdn_url( $repo, $path, $ref = '' ) {
	$ref = $ref ? $ref : rcvda_vcse_sector_default_ref();
	return sprintf( 'https://cdn.jsdelivr.net/gh/%s@%s/%s', $repo, rawurlencode( $ref ), ltrim( $path, '/' ) );
}

/**
 * Register (but do not enqueue) assets. Enqueued on demand by the shortcode.
 */
function rcvda_vcse_sector_register_assets() {
	wp_register_style(
		'rcvda-vcse-sector',
		RCVDA_VCSE_SECTOR_URL . 'assets/css/vcse-sector.css',
		array(),
		RCVDA_VCSE_SECTOR_VER
	);
	wp_register_script(
		'rcvda-vcse-sector',
		RCVDA_VCSE_SECTOR_URL . 'assets/js/vcse-sector.js',
		array(),
		RCVDA_VCSE_SECTOR_VER,
		true
	);
}
add_action( 'init', 'rcvda_vcse_sector_register_assets' );

/**
 * [rcvda_vcse_sector data="tees-valley" source="live" ref="" title=""]
 *
 * data   — dataset slug from the registry (default "tees-valley").
 * source — "live" (default): load from the jsDelivr CDN, falling back to the
 *          copies bundled inside the plugin if the CDN is unreachable. "bundled":
 *          use only the bundled copies — self-contained, zero external request.
 * ref    — git branch or release tag for live data (default: filterable "main").
 * title  — heading shown in the dashboard masthead (default "State of the Sector").
 */
function rcvda_vcse_sector_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'data'   => 'tees-valley',
			'source' => 'live',
			'ref'    => '',
			'title'  => '',
		),
		$atts,
		'rcvda_vcse_sector'
	);

	wp_enqueue_style( 'rcvda-vcse-sector' );
	wp_enqueue_script( 'rcvda-vcse-sector' );

	$datasets    = rcvda_vcse_sector_datasets();
	$data        = trim( $atts['data'] );
	$set         = isset( $datasets[ $data ] ) ? $datasets[ $data ] : null;
	$source      = ( 'bundled' === strtolower( $atts['source'] ) ) ? 'bundled' : 'live';

	$bundled_csv = RCVDA_VCSE_SECTOR_URL . 'assets/data/tees-valley-vcse-timeseries.csv';
	$bundled_agg = RCVDA_VCSE_SECTOR_URL . 'assets/data/tees-valley-vcse-aggregates.json';

	if ( $set && 'live' === $source ) {
		$src      = rcvda_vcse_sector_cdn_url( $set['repo'], $set['path'], $atts['ref'] );
		$fallback = $bundled_csv;
		$asrc     = rcvda_vcse_sector_cdn_url( $set['repo'], $set['agg'], $atts['ref'] );
		$afb      = $bundled_agg;
	} else {
		$src      = $bundled_csv; $fallback = '';
		$asrc     = $bundled_agg; $afb = '';
	}

	$title = $atts['title'];
	if ( '' === $title ) {
		$title = 'State of the Sector';
	}
	$area = ( $set && isset( $set['label'] ) ) ? $set['label'] : 'Tees Valley';

	static $n = 0;
	$n++;
	$id = 'rcvda-vcse-sector-' . $n;

	return sprintf(
		'<div class="rcvda-vcse-sector" id="%s" data-src="%s" data-fallback="%s" data-agg-src="%s" data-agg-fallback="%s" data-title="%s" data-area="%s"></div>',
		esc_attr( $id ),
		esc_url( $src ),
		esc_url( $fallback ),
		esc_url( $asrc ),
		esc_url( $afb ),
		esc_attr( $title ),
		esc_attr( $area )
	);
}
add_shortcode( 'rcvda_vcse_sector', 'rcvda_vcse_sector_shortcode' );
