module.exports = {
  variants: {
    items: {
      resize: {
        mini : "300x200",
        preview: "800x600"
      },
      crop: {
        thumb: "200x200"
      },
      resizeAndCrop: {
        large: {resize: "1000x1000", crop: "900x900"}
      }
    },

    gallery: {
      crop: {
        thumb: "100x100"
      }
    }
  },

  storage: {
    Rackspace: {
      auth: {
        username: "maldivianist",
        apiKey: "453bfb34869c3340d621d82b9a9e278c",
        host: "lon.auth.api.rackspacecloud.com"
      },
      container: "anymeme"
    },
    S3: {
      key: 'API_KEY',
      secret: 'SECRET',
      bucket: 'BUCKET_NAME'
    }
  },
  debug: false
}
