import hashlib
p = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref\test-webfetch-test.jpeg"
d = open(p, 'rb').read()
md5 = hashlib.md5(d).hexdigest()
is_default = md5 == "19a0b822edb11957055e4588c2159058"
print(f"Size: {len(d)}, MD5: {md5}, IsDefault: {is_default}")
