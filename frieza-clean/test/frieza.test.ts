import assert from 'node:assert/strict'
import { test } from 'node:test'

import type { Asset } from '../src/frieza.ts'
import { getAssetURL, joinMultilineCommands, mapArch, mapOS } from '../src/frieza.ts'

test('joinMultilineCommands joins backslash-continued lines', () => {
    assert.deepEqual(joinMultilineCommands(['echo a\\', 'b', 'ls']), ['echo a b', 'ls'])
    assert.deepEqual(joinMultilineCommands(['x']), ['x'])
})

test('joinMultilineCommands leaves a trailing backslash buffer unflushed', () => {
    // ponytail: existing behavior kept verbatim, a trailing \ drops the line
    assert.deepEqual(joinMultilineCommands(['a\\']), [])
})

test('mapArch and mapOS map platform names', () => {
    assert.equal(mapArch('x64'), 'amd64')
    assert.equal(mapArch('x32'), '386')
    assert.equal(mapArch('arm64'), 'arm64')
    assert.equal(mapOS('win32'), 'windows')
    assert.equal(mapOS('linux'), 'linux')
})

test('getAssetURL matches by prefix, skips nameless assets, throws when nothing matches', () => {
    const assets = [
        { browser_download_url: 'https://x/skip' } as unknown as Asset,
        { name: 'frieza_0.1.0_linux_amd64.tar.gz', browser_download_url: 'https://x/a' }
    ]
    assert.equal(getAssetURL(assets, 'frieza_0.1.0_linux_amd64'), 'https://x/a')
    assert.throws(() => getAssetURL(assets, 'frieza_0.2.0'), { message: 'Could not determine asset url' })
})
