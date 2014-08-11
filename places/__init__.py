import json
from elasticsearch import Elasticsearch

from hexbin import gen_bins


def get_binned_places(bounds: list, bin_size: float, signals: list=None, field: str=None) -> list:
    print(bounds, signals)

    top_left_point = [bounds[0][1], bounds[1][0]]
    bottom_right_point = [bounds[1][1], bounds[0][0]]

    query = json.dumps({
        "query": {
            "filtered": {
                "query": {
                    "bool": {
                        "must": {"match_all": {}}
                    }
                },
                "filter": {
                    "geo_bounding_box": {
                        "place.location": {
                            "top_left": top_left_point,
                            "bottom_right": bottom_right_point,
                        }
                    }
                }
            }
        }
    })

    print(query)
    es = Elasticsearch()

    start = 0
    total = None
    bins = {}
    while True:
        result = es.search(index='radius', body=query, params={'size': 5000, 'from': start}, doc_type='place')
        if not total:
            print('Total: ', result['hits']['total'])
            total = result['hits']['total']

        points = []
        for hit in result['hits']['hits']:
            location = hit['_source']['location']
            points.append([location['lon'], location['lat']])

        bins = gen_bins(points, bin_size, bins=bins)

        start += 5000
        if start > total:
            return bins
