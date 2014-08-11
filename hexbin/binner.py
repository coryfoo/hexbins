# !/usr/bin/env python3

import math

SQRT3 = 1.73205080756887729352744634150587236


def _nearest_bins_centerpoint(value: float, scale: float):
    """
    Returns the nearest two centerpoint positions (along the same axis) for the
    closest bins to the specified value.

    :param value: Either the x or y value of the point
    :param scale: The scale of the hexagons
    :returns: tuple of closest bin centerpoints
    """
    div, mod = divmod(value, scale / 2)
    rounded = scale / 2 * (div + (1 if div % 2 == 1 else 0))
    rounded_scaled = scale / 2 * (div + (1 if div % 2 == 0 else 0))
    return [rounded, rounded_scaled]


def _distance(x: float, y: float, x1: float, y1: float):
    """
    Returns the Euclidean distance from [x,y] to [x1,y1]
    """
    return math.sqrt((x - x1) * (x - x1) + (y - y1) * (y - y1))


def gen_bins(data: list, bin_width=1, bins=None):
    """
    From the given array of data points ([[x, y], ...]), generate an array of
    hexagonal bins of given bin_width

    :param data: data point array
    :param bin_width: the size of the bins to create
    """
    if not bins:
        bins = {}

    for p in data:
        x, y = p[0], p[1]

        px_nearest = _nearest_bins_centerpoint(x, bin_width)
        py_nearest = _nearest_bins_centerpoint(y, bin_width * SQRT3)

        z1 = _distance(x, y, px_nearest[0], py_nearest[0])
        z2 = _distance(x, y, px_nearest[1], py_nearest[1])

        if z1 < z2:
            bin = str([px_nearest[0], py_nearest[0]])
        else:
            bin = str([px_nearest[1], py_nearest[1]])

        bins[bin] = 1 + bins.get(bin, 0)

    return bins
