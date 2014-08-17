import json
import requests
from elasticsearch import Elasticsearch


def verify_setup() -> bool:
    try:
        resp = requests.get('http://localhost:9200/_scripts/groovy/hexbins')
        return True if resp.status_code == 200 else False
    except:
        return False


def get_binned_places(bounds: list, bin_size: float, signals: list=None) -> list:
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
        },
        "size": 0,
        "aggs": {
            "hexbins": {
                "terms": {
                    "size": 0,
                    "script_id": "hexbins",
                    "lang": "groovy",
                    "params": {
                        "bin_width": bin_size
                    }
                }
            }
        }
    })

    print(query)
    es = Elasticsearch()

    bins = {}
    results = es.search(index='radius', body=query, doc_type='place')

    for bucket in results['aggregations']['hexbins']['buckets']:
        bins[bucket['key']] = bucket['doc_count']

    return bins


def get_binned_matches(bounds: list, account: int, bin_size: float) -> list:
    top_left_point = [bounds[0][1], bounds[1][0]]
    bottom_right_point = [bounds[1][1], bounds[0][0]]

    query = json.dumps({
        "size": 0,
        "aggs": {
            "hexbins": {
                "terms": {
                    "params": {
                        "bin_width": bin_size
                    },
                    "size": 0,
                    "lang": "groovy",
                    "script_id": "hexbins"
                }
            }
        },
        "query": {
            "filtered": {
                "query": {
                    "match_all": {}
                },
                "filter": {
                    "bool": {
                        "should": [
                            {
                                "terms": {
                                    "place_id": {
                                        "index": "production-matches",
                                        "type": "matches",
                                        "id": account,
                                        "cache": False,
                                        "path": "OPEN"
                                    }
                                }
                            },
                            {
                                "terms": {
                                    "place_id": {
                                        "index": "production-matches",
                                        "type": "matches",
                                        "id": account,
                                        "cache": False,
                                        "path": "WON"
                                    }
                                }
                            },
                            {
                                "terms": {
                                    "place_id": {
                                        "index": "production-matches",
                                        "type": "matches",
                                        "id": account,
                                        "cache": False,
                                        "path": "LOST"
                                    }
                                }

                            }
                        ],
                        "must": [
                            {
                                "geo_bounding_box": {
                                    "location": {
                                        "top_left": top_left_point,
                                        "bottom_right": bottom_right_point
                                    }
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
    )

    es = Elasticsearch()

    bins = {}
    results = es.search(index='radius', body=query, doc_type='place')

    for bucket in results['aggregations']['hexbins']['buckets']:
        bins[bucket['key']] = bucket['doc_count']

    return bins


if __name__ == "__main__":
    import math

    bounds = [[37.71513372244835, -122.50283068847659], [37.85080401842779, -122.33116931152347]]
    bin_size = 0.1 * math.pow(2, -3)

    get_binned_places(bounds, bin_size, signals=[])

