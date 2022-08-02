# Frieza clean action

This action will clean the resources created between the call to the end of the calling GitHub Action

## Inputs

## `access_key`

**Required** The 3DS Outscale Access Key.

## `secret_key`

**Required** The 3DS Outscale Secret Key.

## `region`

**Required** The 3DS Outscale region.

## `frieza_version`

The version of Frieza to use. Default is "`latest`".
## `clean_timeout`

Timeout when cleaning all the resources in order not to get stuck. Default is "`5m`".

## `error_on_dirty`

Exit in error when the account is not clean. Default is "`false`".


## Example usage
```
uses: outscale-dev/frieza-github-actions/frieza-clean@master
with:
    access_key: ${{ secrets.OSC_ACCESS_KEY }}
    secret_key: ${{ secrets.OSC_SECRET_KEY }}
    region: ${{ secrets.OSC_REGION }}
```