import json
from elasticsearch import Elasticsearch
from elasticsearch.helpers import scan

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
                        "location": {
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

    bins = {}
    results = scan(es, query=query, doc_type='place', _source_include=["location.*"], index='radius')

    for hit in results:
        location = hit['_source']['location']
        bins = gen_bins([[location['lon'], location['lat']]], bin_size, bins=bins)

    return bins


if __name__ == "__main__":
    import math

    bounds = [[37.71513372244835, -122.50283068847659], [37.85080401842779, -122.33116931152347]]
    bin_size = 0.1 * math.pow(2, -3)

    get_binned_places(bounds, bin_size, signals=[], field='location')

