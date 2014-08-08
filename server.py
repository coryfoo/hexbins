#!/usr/bin/env python3

from bottle import route, run, static_file, request, response
import json
import math

import hexbin

DATA = None


@route('/bins')
def get_bins_for_google_maps():
    global DATA
    if not DATA:
        DATA = hexbin.gen_data()

    bin_size = 0.1 * math.pow(2, 9 - int(request.params.get('zoom')))
    bins = hexbin.gen_bins(DATA, bin_size)
    response.content_type = 'application/json'
    return json.dumps({"binSize": bin_size, "bins": bins})


@route('/')
@route('/<filepath:path>')
def index(filepath=None):
    if filepath is None or filepath == '/':
        filepath = 'index.html'

    return static_file(filepath, root='web/')


run(host='localhost', port=8080, debug=True)
