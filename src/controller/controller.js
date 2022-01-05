import { Router } from 'express'
import multer from 'multer'
import { join } from 'path'
import mod from '../module/module.js'

const rout = Router()
const upload = multer({ limits: { fileSize: 200 * 1024 * 1024 } }).single(
  'register_file'
)

rout.get('/search', async (req, res) => {
  try {
    let { s, US } = req.query

    if (!s && !US) {
      throw new Error('malumot yuq!')
    }

    let db = await mod.read_db()

    for (const key in db) {
      if (Object.hasOwnProperty.call(db, key)) {
        const obj = db[key]

        delete db[key]['parol']
        delete db[key]['userAgent']
        if (US) {
          if (US != key) {
            delete db[key]
          }
        }
        for (const vid in obj['videos']) {
          if (Object.hasOwnProperty.call(obj['videos'], vid)) {
            const vel = obj['videos'][vid]
            if (US) continue
            let mini = vel['title'].toLowerCase()
            let mini2 = s.toLowerCase()
            if (!mini.includes(mini2)) {
              delete db[key]
            }
          }
        }
      }
    }

    return res.json({ db })
  } catch (xato) {
    return res.json({ ERROR: xato['message'] })
  }
})

rout.get('/download', async (req, res) => {
  try {
    let { u } = req.query
    if (!u) {
      throw new Error('malumot yuq!')
    }
    return res.download(join(process.cwd(), 'src', 'res', u))
  } catch (xato) {
    res.json({ ERROR: xato['message'] })
  }
})

rout.get('/all/user', async (req, res) => {
  try {
    let db = await mod.read_db()

    for (const key in db) {
      if (Object.hasOwnProperty.call(db, key)) {
        const element = db[key]
        delete element['parol']
        delete element['userAgent']
      }
    }

    res.json(db)
  } catch (xato) {
    return res.json({ ERROR: xato['message'] })
  }
})

// delete video
rout.delete('/video/old', async (req, res) => {
  try {
    let { token } = req.headers

    if (!token) {
      throw new Error('user malumoti yuq!')
    }

    let asd = await mod.validate_token(token, req.headers['user-agent'])

    if (asd['ERROR']) {
      throw new Error(asd['ERROR'])
    }
    let { vide_id } = req.body

    if (!vide_id) {
      throw new Error('video malumoti yuq!')
    }

    let qwe = mod.delete_video(asd['id'], vide_id)
    return res.json(qwe)
  } catch (xato) {
    return res.json({ ERROR: xato['message'] })
  }
})

//change title video
rout.put('/video/old', async (req, res) => {
  try {
    let { token } = req.headers

    if (!token) {
      throw new Error('user malumoti yuq!')
    }

    let asd = await mod.validate_token(token, req.headers['user-agent'])

    if (asd['ERROR']) {
      throw new Error(asd['ERROR'])
    }
    let { vide_id, newTitle } = req.body

    if (!vide_id) {
      throw new Error('video malumoti yuq!')
    }
    if (!newTitle) {
      throw new Error('video malumoti yuq!')
    }
    if (!newTitle.length > 50) {
      throw new Error('Yangi title juda uzun!')
    }

    let qwe = await mod.change_title(asd['id'], newTitle, vide_id)
    return res.json(qwe)
  } catch (xato) {
    return res.json({ ERROR: xato['message'] })
  }
})

rout.post('/video/new', async (req, res) => {
  try {
    let { token } = req.headers

    if (!token) {
      throw new Error('user malumoti yuq!')
    }

    let asd = await mod.validate_token(token, req.headers['user-agent'])

    if (asd['ERROR']) {
      throw new Error(asd['ERROR'])
    }

    upload(req, res, async err => {
      try {
        if (err instanceof multer.MulterError) {
          return res.json({
            ERROR: err.message,
          })
        } else if (err) {
          return res.json({
            ERROR: err.message,
          })
        }

        if (!req?.file?.mimetype) {
          return res.json({
            ERROR: 'File yuklang!',
          })
        }

        if (!/(video)/g.test(req.file.mimetype)) {
          return res.json({
            ERROR: 'video yuklang!',
          })
        }
        //end validate file
        let { title_video } = req.body
        if (!title_video) {
          return res.json({
            ERROR: 'video title bush!',
          })
        }
        if (title_video.length > 50) {
          return res.json({
            ERROR: 'video title juda uzun!',
          })
        }
        let qwe = await mod.write_video(asd['id'], req['file'], title_video)
        return res.json(qwe)
      } catch (_xato) {
        return res.json({ ERROR: _xato.message })
      }
    })
  } catch (xato) {
    return res.json({ ERROR: xato.message })
  }
})

rout.post('/video/all', async (req, res) => {
  try {
    let { token } = req.headers
    if (!token) {
      throw new Error('user malumoti yuq!')
    }

    let user_data = await mod.validate_token(token, req.headers['user-agent'])

    if (user_data['ERROR']) {
      throw new Error(user_data['ERROR'])
    }
    return res.json({ videos: user_data['usr']['videos'] })
  } catch (xato) {
    return res.json({ ERROR: xato.message })
  }
})

rout.post('/user/old', async (req, res) => {
  try {
    let { username, parol } = req.body
    if (!username || !parol) {
      throw new Error('login yoki parol bush!')
    }
    let asd = await mod.validate_login(username, parol)
    res.json(asd)
  } catch (xato) {
    return res.json({ ERROR: xato.message })
  }
})

rout.post('/user/new', async (req, res) => {
  try {
    //hanler error
    upload(req, res, async err => {
      try {
        if (err instanceof multer.MulterError) {
          return res.json({
            ERROR: err.message,
          })
        } else if (err) {
          return res.json({
            ERROR: err.message,
          })
        }

        if (!req?.file?.mimetype) {
          return res.json({
            ERROR: 'File yuklang!',
          })
        }

        if (!/(image)/g.test(req.file.mimetype)) {
          return res.json({
            ERROR: 'Rasm yuklang!',
          })
        }
        //end validate file

        if (
          !req.body['register_name'] ||
          req.body['register_name'].length < 1
        ) {
          return res.json({
            ERROR: 'User name bush!',
          })
        }
        if (req.body['register_name'].length > 50) {
          return res.json({
            ERROR: 'User name juda uzun',
          })
        }
        //end username validate

        if (
          !req.body['register_pass'] ||
          req.body['register_pass'].length < 1
        ) {
          return res.json({
            ERROR: 'User password bush!',
          })
        }
        if (req.body['register_pass'].length > 15) {
          return res.json({
            ERROR: 'User password juda uzun!',
          })
        }
        if (!/[a-z]/g.test(req.body['register_pass'])) {
          return res.json({
            ERROR: 'User password: harf qatnashtiring!',
          })
        }
        if (!/[0-9]/g.test(req.body['register_pass'])) {
          return res.json({
            ERROR: 'User password: son qatnashtiring!',
          })
        }
        if (!/[^\w]|_/g.test(req.body['register_pass'])) {
          return res.json({
            ERROR: 'User password: symbol qatnashtiring!',
          })
        }
      } catch (_xato) {
        return res.json({
          ERROR: _xato.message,
        })
      } //end upload try

      let asd = await mod.write_img(
        req.file,
        req.body,
        req.headers['user-agent']
      )
      res.json(asd)
    })
  } catch (xato) {
    return res.json({ ERROR: xato.message })
  }
})

export default rout
