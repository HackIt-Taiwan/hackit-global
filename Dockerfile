# Official Docker Hub multi-platform Node 24 LTS index, verified 2026-11-02:
# https://registry-1.docker.io/v2/library/node/manifests/24-bookworm-slim
# Refresh this digest deliberately when applying Node/Debian security updates.
FROM node:24-bookworm-slim@sha256:c86ecead9e55a5210ac1727de38a4ca840bf03dcaf34dc9749addbf383b1920c AS build
WORKDIR /build
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN python3 -m venv /opt/build-venv \
    && /opt/build-venv/bin/python -m pip install --no-cache-dir --only-binary=:all: --require-hashes -r requirements.txt
ENV PATH="/opt/build-venv/bin:${PATH}"
COPY package.json ./
COPY scripts ./scripts
COPY source ./source
COPY server ./server
RUN npm run build

# Official maintained Google distroless Node 24 Debian 13 nonroot image index,
# verified 2026-11-02 at https://gcr.io/v2/distroless/nodejs24-debian13/manifests/nonroot
FROM gcr.io/distroless/nodejs24-debian13:nonroot@sha256:088a01637f22908632ba09018be2e0b516f2fa6f7869c191d29491139db43c78 AS runtime
ENV NODE_ENV=production PORT=3000 HOST=0.0.0.0
WORKDIR /app
# Only the built public tree, public site metadata, and dependency-free runtime
# enter the final image. Runtime files stay root-owned and read-only to nonroot.
COPY --from=build --chown=0:0 /build/dist/public ./dist/public
COPY --from=build --chown=0:0 /build/dist/site-config.json ./dist/site-config.json
COPY --from=build --chown=0:0 /build/server ./server
USER 65532:65532
EXPOSE 3000
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/nodejs/bin/node", "--input-type=module", "-e", "import http from 'node:http';const req=http.get({hostname:'127.0.0.1',port:Number(process.env.PORT||3000),path:'/healthz',timeout:3000},res=>{res.resume();if(res.statusCode!==200)process.exitCode=1});req.on('timeout',()=>{req.destroy();process.exitCode=1});req.on('error',()=>{process.exitCode=1})"]
ENTRYPOINT ["/nodejs/bin/node"]
CMD ["--disable-proto=throw", "server/index.mjs"]
