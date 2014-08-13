#!/usr/bin/env python3

from bottle import route, run, static_file, request, response
import json
import math

import places


@route('/bins')
def get_bins_for_google_maps():
    bounds = json.loads(request.params.get('bounds'))
    signals = json.loads(request.params.get('signals'))
    bin_size = 0.075 * math.pow(2, 9 - int(request.params.get('zoom')))

    bins = places.get_binned_places(bounds, bin_size, signals=signals, field='location')
    response.content_type = 'application/json'
    return json.dumps({"binSize": bin_size, "bins": bins})


@route('/')
@route('/<filepath:path>')
def index(filepath=None):
    if filepath is None or filepath == '/':
        filepath = 'index.html'

    return static_file(filepath, root='web/')


run(host='localhost', port=8080, debug=True)
