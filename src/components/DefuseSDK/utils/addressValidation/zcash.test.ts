import { describe, expect, it } from "vitest"
import { validateZcashUnifiedAddress } from "./zcash"

describe("validateZcashUnifiedAddress()", () => {
  // From zcash-test-vectors, test-vectors/json/unified_address.json (vector index)
  it.each([
    [
      "p2pkh + sapling + orchard (#3)",
      "u1pg2aaph7jp8rpf6yhsza25722sg5fcn3vaca6ze27hqjw7jvvhhuxkpcg0ge9xh6drsgdkda8qjq5chpehkcpxf87rnjryjqwymdheptpvnljqqrjqzjwkc2ma6hcq666kgwfytxwac8eyex6ndgr6ezte66706e3vaqrd25dzvzkc69kw0jgywtd0cmq52q5lkw6uh7hyvzjse8ksx",
    ],
    [
      "p2pkh + orchard (#9)",
      "u1snf9yr883aj2hm8pksp9aymnqdwzy42rpzuffevj35hhxeckays5pcpeq7vy2mtgzlcuc4mnh9443qnuyje0yx6h59angywka4v2ap6kchh2j96ezf9w0c0auyz3wwts2lx5gmk2sk9",
    ],
    [
      "orchard only (#27)",
      "u1ddnjsdcpm36r6aq79n3s68shjweksnmwtdltrh046s8m6xcws9ygyawalxx8n6hg6vegk0wh8zjnafxgh6msppjsljvyt0ynece3lvm0",
    ],
    [
      "orchard + unknown typecode (#36)",
      "u1uehkuaq6rpfgt4ed5zpvhczg9apgpmyk5eq9qg23j8w7jxkhdnqzacte6gu8zgzfzgxy48ryzus3wnkhfxrxmlhs34xde3f34uxcnv3y6dsgj288vu56xs9f6ghvqsgkhuwtz4kkfxj8pa27v5p3ttlst340zvwx9nj6s0zw8p3wwk3zh37dwc7znqz52gj2fpaapzxzyagah0aeyxwa9fxxvyyj6w989v96ymsgf7s8s6ej9346p60fcjzzynvf9rmxevumdvt8l9mvhdfz4u5j4h7e0zjr2sde7fu7z9s02447qg6qzllm22egnx6ej6qczkkk2ygvpy08un9ggp853sddp6vskrlar6sygxec5f6c2t2eu9zmc728esy4sj9z853gxuplr6hw7lpcwzk20d85vuflnhlfv8nr3020r0v9z83ryudsyjv66rttxq2cscqlrdxakrmpjptzcf",
    ],
    [
      "sapling only (#45)",
      "u187vrwl4ampyxd5m6aj38n4ndkmj8v6gs97hkt23aps3sn5k89a0gk2smluexgdprcrtm56ezc5c7tjwlrnnl79tjtrxmqd42c5mpyz7g",
    ],
  ])("valid: %s", (_name, address) => {
    expect(validateZcashUnifiedAddress(address)).toBe(true)
  })

  // Vector #27's Orchard receiver plus a metadata item outside the
  // MUST-understand range, which consumers ignore
  it("valid: orchard + ignorable metadata 0xC0 (64 bytes)", () => {
    expect(
      validateZcashUnifiedAddress(
        "u1fm32dnaewyvygn4djt26u3nadycxmn8999x4m8l8p6983laejlk2r3w48hvwrkp20jcz60ndygd6amvqak099rxe25tfp8u8f0888jqwlked7"
      )
    ).toBe(true)
  })

  // Correct Bech32m and F4Jumble, each with one ZIP-316 rule broken
  it.each([
    [
      "transparent receiver only (38 bytes)",
      "u1zt8jctg466z3sa68p60yc332fyhg6zkg6e5d4c9he7xytx9ujvhs99rvt7qcxgmmgvg",
    ],
    [
      "wrong padding (61 bytes)",
      "u13q3p90awvhjh93fzfm42nv2afced8f9yhl7ksq84szj5yt9wcdsqu4q2kc5jmjz7hel4s664jgvx7amcq8g8jhsunqv2337cdqkgeyyw",
    ],
    [
      "both P2PKH and P2SH (105 bytes)",
      "u15zpfmukhsvjkdqge8qk0zql9n83mf66tazyz8pza546qg739detdxcl609rsefk9tu2s9vnuen9xmd2fnzu8rc63qul47k5g323a33zenfvz7fx8g5f3j5xgxfkcwsugy6yttw3c0f9rnsy3u5qd778mmk35uf4fc3l3q4mnnrz5z3",
    ],
    [
      "items out of order (106 bytes)",
      "u1zt4xpnwgduql7pw2jlhnls693p4ewq208jpenffr4rvl8xtv8n5e8zww2ngeh2lg6wzwku35ts362yqpdxmyw22rfr5uex77lqsksngf264xsw9e09z4634tmwxc5nddtdt7dqz7lec2y4h0l2yfvj8hajafg99jdaxhf7l93ygy3lm4",
    ],
    [
      "wrong Orchard receiver length (60 bytes)",
      "u1dzd7tpr26ffx83w3cgazmzd0z594f44tmuv4e6txtzhf5ua8zslufl7tn8n88mdtek4p0555cfxs3s7mux9werqt0fldsqtvffrqlt",
    ],
    [
      "MUST-understand metadata item 0xE0 (67 bytes)",
      "u1hlfmws84g4h2fm56vfwtay0akyfesc6nur2ylhccpgqgjdylxmqvqmm57xdugy4sp70fw5mnmfhmrdt2ju8qur0qw0l282240exekagxkrtq02z7x5",
    ],
    [
      "non-canonical CompactSize typecode (63 bytes)",
      "u1y5eet2q707fyylyujr36ldumsdjrg09x4m37250mdfpnz8m72x9exuc7ekeytkak6umm6udwpy2j94n4zprkkrsf2ah826ce3948z3zmyrk",
    ],
    [
      "typecode above 0x02000000 (67 bytes)",
      "u1qxnk2cz4vxf852g36txc2hcf5ha7vah0dz7uv3f7233wtfhgrj9jkx3gan7erjy9vf3r5kv82dltwn4zmk48dm97ggcuqxk2jua33ffne44q4k93uu",
    ],
  ])("invalid: %s", (_name, address) => {
    expect(validateZcashUnifiedAddress(address)).toBe(false)
  })

  // Not a mainnet unified address
  it.each([
    [
      "testnet HRP (61 bytes)",
      "utest1jeykdhzrwz45pnx9pqd2uefaxdedyrmyq4l2r5l9uxq583gj8k397f6s0wvf724py7fjuhy94glytwljsmezgyeyruk2wcktec3ykh4y",
    ],
    [
      "corrupted checksum",
      "u1ddnjsdcpm36r6aq79n3s68shjweksnmwtdltrh046s8m6xcws9ygyawalxx8n6hg6vegk0wh8zjnafxgh6msppjsljvyt0ynece3lvmq",
    ],
    [
      "the 78-character example in validateAddress.test.ts",
      "u1pv2h74qrlq9k9uqh6xk5p6vyzgvj84h6jedxg9e6hfhske3xjqf27f2qsm2qz4t3zqnll98t9n60",
    ],
    ["a transparent address", "t1XJD5btQc9qHHzywPS8xhPbs2hbXGXWLFq"],
    ["empty", ""],
  ])("invalid: %s", (_name, address) => {
    expect(validateZcashUnifiedAddress(address)).toBe(false)
  })
})
