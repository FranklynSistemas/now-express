const express = require('express')
const app = express()
const httpServer = require('http').createServer(app)

const port = 5000
const usuarios = []
let Juego = []
const usuariosConectados = {}
let NumClicks = 0
let newGame = false

var io = require('socket.io').listen(httpServer)

io.set('log level', 1)

// Body parser
app.use(express.urlencoded({ extended: false }))

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to a basic express App')
})

// Mock API
app.get('/users', (req, res) => {
  res.json([
    { name: 'William', location: 'Abu Dhabi' },
    { name: 'Chris', location: 'Vegas' }
  ])
})

app.post('/user', (req, res) => {
  const { name, location } = req.body

  res.send({ status: 'User created', name, location })
})

io.sockets.on('connection', function (socket) {
  socket.on('newUser', function (data) {
    console.log(data)
    if (usuariosConectados[data.Nombre]) {
      socket.emit('error', true)
    } else {
      socket.emit('error', false)
      socket.nickname = data.Nombre
      usuariosConectados[data.Nombre] = socket.nickname
      console.log(socket.nickname)
      usuarios.push(data)
      io.sockets.emit('Users', usuarios)
      io.sockets.emit('conectados', { Nombre: socket.nickname, Clicks: NumClicks })
    }
  })

  socket.on('IniJuego', function (juego) {
    Juego = juego
    NumClicks = 0
    io.sockets.emit('conectados', { Nombre: socket.nickname, Clicks: NumClicks })
  })

  socket.on('ingresaNewUser', function () {
    socket.emit('inicioJuego', Juego)
  })

  socket.on('juega', function (data) {
    findUser(socket.nickname, data.Puntaje)
    Juego = data.Juego
    NumClicks = data.Clicks
    io.sockets.emit('DibujeJuego', { Juego: data.Juego, Clicks: data.Clicks })
    io.sockets.emit('Actualiza', ordenarArray())
    io.sockets.emit('Puntua', socket.nickname)
  })

  socket.on('reiniciaJuego', function (data) {
    if (!newGame) {
      Juego = data.Juego
      reiniciaUsuarios()

      // new line
      io.sockets.emit('SeReiniciaJuego', { usuarios: usuarios, User: socket.nickname })
      io.sockets.emit('Actualiza', usuarios)
      io.sockets.emit('DibujeJuego', { Juego: data.Juego, Clicks: data.Clicks })
      io.sockets.emit('BorraPuntajes')
      setTimeout(function () { newGame = false }, 10000)
    }
  })

  socket.on('ActualizaClicks', function () {
    NumClicks = 0
  })

  socket.on('disconnect', function () {
    if (socket.sala === undefined) {
      console.log(socket.nickname + ' Se ha desconectado ')
      // Eliminamos al usuario de los conectados
      delete usuariosConectados[socket.nickname]
      if (buscaEliminar(socket.nickname) != -1) {
        usuarios.splice(buscaEliminar(socket.nickname), 1)
      }
      // Mandamos la información a las Sockets
      io.sockets.emit('Actualiza', usuarios)
      io.sockets.emit('Desconectado', socket.nickname)
    }
  })
})

// Listen on port port
httpServer.listen(port)
console.log(`Server is booming on port ${port} Visit http://localhost:${port}`)


function reiniciaUsuariosSalas (data) {
  for (const i in data) {
    data[i].Puntaje = 0
  }
  return data
}

function reiniciaUsuarios () {
  for (const i in usuarios) {
    usuarios[i].Puntaje = 0
  }
}

function findUser (user, puntaje) {
  for (const i in usuarios) {
    if (usuarios[i].Nombre === user) {
      usuarios[i].Puntaje = puntaje
      break
    }
  }
}

function buscaEliminar (nombre) {
  for (const i in usuarios) {
    if (usuarios[i].Nombre === nombre) {
      return i
    };
  }
  return -1
}

function ordenarArray () {
  var ArrayOrdenado = usuarios
  ArrayOrdenado.sort(function (a, b) {
    if (a.Puntaje > b.Puntaje) {
      return 1
    }
    if (a.Puntaje < b.Puntaje) {
      return -1
    }
    return 0
  })
  return ArrayOrdenado
}

function ordenarArraySala (usr) {
  var ArrayOrdenado = usr
  ArrayOrdenado.sort(function (a, b) {
    if (a.Puntaje > b.Puntaje) {
      return 1
    }
    if (a.Puntaje < b.Puntaje) {
      return -1
    }
    return 0
  })
  return ArrayOrdenado
}

function buscaPosUser (data) {
  var pos = 0
  for (const i in data.usuarios) {
    if (data.usuarios[i] === data.Nombre) {
      pos = i
      break
    }
  }
  data.usuarios.splice(pos, 1)
  return data.usuarios
}