/**
 * Modified from original at https://github.com/substack/rsa-unpack.git
 */

/**
 *
 * @param pem
 * @returns {*}
 */
"use strict";

/**
 *
 * @param pem
 * @returns {*}
 */
module.exports = function (pem) {

    if (typeof pem !== "string") {
        pem = String(pem);
    }

    let certText = pem.split(/(\r\n|\r|\n)+/g);
    certText = certText.filter(function (line) {
        return line.trim().length !== 0;
    });

    let m = /^-----BEGIN RSA (PRIVATE|PUBLIC) KEY-----/.exec(certText[0]);
    if (!m) return undefined;

    let type = m[1].toLowerCase();

    if (certText.slice(-1)[0] !== ("-----END RSA " + m[1] + " KEY-----")) {
        return undefined;
    }

    let buf = Buffer(certText.slice(1, -1).join(""), "base64");

    let field = {};
    let size = {};
    let offset = {
        private: buf[1] & 0x80 ? buf[1] - 0x80 + 5 : 7,
        public: buf[1] & 0x80 ? buf[1] - 0x80 + 2 : 2
    }[type];

    /**
     *
     * @returns
     * @private
     */
    function __read() {
        let s = buf.readUInt8(offset + 1);

        if (s & 0x80) {
            let n = s - 0x80;
            s = buf[[
                "readUInt8", "readUInt16BE"
            ][n - 1]](offset + 2);
            offset += n;
        }

        offset += 2;

        let b = buf.slice(offset, offset + s);
        offset += s;
        return b;
    }

    field.modulus = __read();

    field.bits = (field.modulus.length - 1) * 8 + Math.ceil(
        Math.log(field.modulus[0] + 1) / Math.log(2)
    );
    field.publicExponent = parseInt(__read().toString("hex"), 16);

    if (type === "private") {
        field.privateExponent = __read();
        field.prime1 = __read();
        field.prime2 = __read();
        field.exponent1 = __read();
        field.exponent2 = __read();
        field.coefficient = __read();
    }

    return field;
};
