{ 
  "script":"
x = doc['location'].lon;
y = doc['location'].lat;

SQRT3 = 1.73205080756887729352744634150587236;

scale = bin_width / 2;
div = Math.floor(x / scale) as int;
rounded = scale * (div + (div % 2 != 0 ? 1 : 0));
roundedScaled = scale * (div + (div % 2 == 0 ? 1 : 0));

pxNearest = [rounded, roundedScaled];

scale = (bin_width * SQRT3) / 2;
div = Math.floor(y / scale);
rounded = scale * (div + (div % 2 != 0 ? 1 : 0));
roundedScaled = scale * (div + (div % 2 == 0 ? 1 : 0));

pyNearest = [rounded, roundedScaled];

z1 = sqrt((x - pxNearest[0]) * (x - pxNearest[0]) + (y - pyNearest[0]) * (y - pyNearest[0]));
z2 = sqrt((x - pxNearest[1]) * (x - pxNearest[1]) + (y - pyNearest[1]) * (y - pyNearest[1]));

if (z1 < z2) {
    bin = [pxNearest[0], pyNearest[0]];
} else {
    bin = [pxNearest[1], pyNearest[1]];
};

return '['+bin.join(',')+']';
"
}
