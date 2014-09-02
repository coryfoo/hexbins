#!/usr/bin/env python3

from bottle import route, run, static_file, request, response
import json
import math

import places


@route('/bins')
def get_bins_for_google_maps():
    bounds = json.loads(request.params.get('bounds'))
    filters = json.loads(request.params.get('filters'))
    bin_size = 0.075 * math.pow(2, 9 - int(request.params.get('zoom')))

    response.content_type = 'application/json'
    return json.dumps(places.get_binned_places(bounds, bin_size, filters=filters))


@route('/account-bins')
def get_bins_for_google_maps():
    bounds = json.loads(request.params.get('bounds'))
    account = request.params.get('account')
    filters = json.loads(request.params.get('filters'))
    bin_size = 0.075 * math.pow(2, 9 - int(request.params.get('zoom')))

    response.content_type = 'application/json'
    return json.dumps(places.get_binned_matches(bounds, account, bin_size, filters=filters))


@route('/verify')
def verify():
    response.content_type = 'application/json'
    return json.dumps({"valid": places.verify_setup()})


@route('/metros')
def verify():
    account = request.params.get('account')
    response.content_type = 'application/json'
    return json.dumps(places.top_metros(account))


@route('/status-counts')
def account_status_counts():
    account = request.params.get('account')
    response.content_type = 'application/json'
    return json.dumps(places.get_total_status_counts(account))


@route('/')
@route('/<filepath:path>')
def index(filepath=None):
    if filepath is None or filepath == '/':
        filepath = 'index.html'

    return static_file(filepath, root='web/')


run(host='localhost', port=8080, debug=True)
