#!/bin/bash

cd ${OKTA_HOME}/${REPO}

setup_service bundler

if ! bundle install; then
  echo "bundle install failed! Exiting..."
  exit ${FAILED_SETUP}
fi


# Install required dependencies
yarn global add @okta/ci-update-package
yarn global add @okta/ci-pkginfo
export PATH="${PATH}:$(yarn global bin)"

# Yarn does not utilize the npmrc/yarnrc registry configuration
# if a lockfile is present. This results in `yarn install` problems
# for private registries. Until yarn@2.0.0 is released, this is our current
# workaround.
#
# Related issues:
#  - https://github.com/yarnpkg/yarn/issues/5892
#  - https://github.com/yarnpkg/yarn/issues/3330

YARN_REGISTRY=https://registry.yarnpkg.com
OKTA_REGISTRY=${ARTIFACTORY_URL}/api/npm/npm-okta-master

# Replace yarn artifactory with Okta's
sed -i "s#${YARN_REGISTRY}#${OKTA_REGISTRY}#" yarn.lock

if ! yarn install; then
  echo "yarn install failed! Exiting..."
  exit ${FAILED_SETUP}
fi

# Revert the origional change
sed -i "s#${OKTA_REGISTRY}#${YARN_REGISTRY}#" yarn.lock

if ! yarn build:release; then
  echo "yarn build release failed! Exiting..."
  exit ${FAILED_SETUP}
fi
