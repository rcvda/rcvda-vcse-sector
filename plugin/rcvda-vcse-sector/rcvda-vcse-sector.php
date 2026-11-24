<?php
/**
 * Plugin Name:       RCVDA VCSE Sector
 * Description:       "State of the Sector" living dashboard. Renders the Tees Valley registered-VCSE sector size as a weekly-updated time series via the [rcvda_vcse_sector] shortcode — read live from the public open-data repo over the jsDelivr CDN, with automatic fallback to a bundled copy. Headline measure is based-in (registered office in the borough). Data lives in rcvda/tees-valley-vcse-sector.
 * Version:           0.1.0
 * Author:            RCVDA
 * License:           GPL-2.0-or-later
 * Text Domain:       rcvda-vcse-sector
 * Update URI:        https://github.com/rcvda/rcvda-vcse-sector
 * Primary Branch:    main
 * Release Asset:     true
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

define( 'RCVDA_VCSE_SECTOR_VER', '0.1.0' );
define( 'RCVDA_VCSE_SECTOR_URL', plugin_dir_url( __FILE__ ) );
define( 'RCVDA_VCSE_SECTOR_DIR', plugin_dir_path( __FILE__ ) );

/**
 * Default git ref (branch or release tag) used to build the live jsDelivr URL.
 *
 * The data repo appends a new point weekly on `main`, so 'main' is the right
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
 * Each entry names a PUBLIC GitHub repo and the path to the time-series CSV
 * (segment,borough,snapshot_date,definition,active,total,n_sources) within it.
 * Add more datasets (e.g. a North East series) with the
 * `rcvda_vcse_sector_datasets` filter — no change to this file needed.
 */
function rcvda_vcse_sector_datasets() {
	$datasets = array(
		'tees-valley' => array(
			'repo'  => 'rcvda/tees-valley-vcse-sector',
			'path'  => 'data/tees-valley-vcse-timeseries.csv',
			'label' => 'Tees Valley',
		),
	);
	return apply_filters( 'rcvda_vcse_sector_datasets', $datasets );
}

/**
 * Build a jsDelivr CDN URL for a dataset at a given ref.
 *
 * jsDelivr mirrors public GitHub repos from a CDN with permissive CORS — the
 * correct way to reference a repo file from a production front end.
 * (raw.githubusercontent.com is not a CDN, rate-limits, and is not meant for
 * production traffic.) Returns '' if the dataset slug is unknown.
 */
function rcvda_vcse_sector_remote_url( $dataset, $ref = '' ) {
	$sets = rcvda_vcse_sector_datasets();
	if ( empty( $sets[ $dataset ] ) ) {
		return '';
	}
	$repo = $sets[ $dataset ]['repo'];
	$path = ltrim( $sets[ $dataset ]['path'], '/' );
	$ref  = $ref ? $ref : rcvda_vcse_sector_default_ref();
	return sprintf( 'https://cdn.jsdelivr.net/gh/%s@%s/%s', $repo, rawurlencode( $ref ), $path );
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
 * data   — dataset slug from the registry (default "tees-valley"), OR a full
 *          http(s) URL to a time-series CSV to use directly (advanced override).
 * source — "live" (default): load from the jsDelivr CDN, falling back to the
 *          copy bundled inside the plugin if the CDN is unreachable. "bundled":
 *          use only the bundled copy — self-contained, zero external data request.
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

	$bundled  = RCVDA_VCSE_SECTOR_URL . 'assets/data/tees-valley-vcse-timeseries.csv';
	$datasets = rcvda_vcse_sector_datasets();
	$data     = trim( $atts['data'] );
	$source   = ( 'bundled' === strtolower( $atts['source'] ) ) ? 'bundled' : 'live';

	if ( $data && preg_match( '#^https?://#i', $data ) ) {
		$src      = $data;
		$fallback = $bundled;
	} elseif ( 'live' === $source && isset( $datasets[ $data ] ) ) {
		$remote   = rcvda_vcse_sector_remote_url( $data, $atts['ref'] );
		$src      = $remote ? $remote : $bundled;
		$fallback = $remote ? $bundled : '';
	} else {
		$src      = $bundled;
		$fallback = '';
	}

	$title = $atts['title'];
	if ( '' === $title ) {
		$title = 'State of the Sector';
	}
	$area = ( isset( $datasets[ $data ]['label'] ) ) ? $datasets[ $data ]['label'] : 'Tees Valley';

	static $n = 0;
	$n++;
	$id = 'rcvda-vcse-sector-' . $n;

	return sprintf(
		'<div class="rcvda-vcse-sector" id="%s" data-src="%s" data-fallback="%s" data-title="%s" data-area="%s"></div>',
		esc_attr( $id ),
		esc_url( $src ),
		esc_url( $fallback ),
		esc_attr( $title ),
		esc_attr( $area )
	);
}
add_shortcode( 'rcvda_vcse_sector', 'rcvda_vcse_sector_shortcode' );
