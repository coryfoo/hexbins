# !/usr/bin/env python3

import json
import random

NUM_POINTS = 100
MIN_X, MAX_X = -105.3, -104.8
MIN_Y, MAX_Y = 39.6, 40


def gen_data(num_points=NUM_POINTS, min_x=MIN_X, max_x=MAX_X, min_y=MIN_Y, max_y=MAX_Y):
    return [[(max_x - min_x) * random.random() + min_x, (max_y - min_y) * random.random() + min_y] for _ in range(num_points)]


if __name__ == "__main__":
    print(json.dumps(gen_data()))