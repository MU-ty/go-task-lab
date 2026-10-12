FROM golang:1.27.2-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/api ./cmd/api

FROM alpine:3.23
RUN apk add --no-cache ca-certificates && addgroup -S app && adduser -S app -G app
COPY --from=build /out/api /usr/local/bin/api
USER app
EXPOSE 8090
ENTRYPOINT ["/usr/local/bin/api"]
