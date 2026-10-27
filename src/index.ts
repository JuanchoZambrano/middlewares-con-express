import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";

const app = express();
const PORT = 3000;

// MIDDLEWARES
app.use(express.json());

const validarProducto = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { nombre, precio } = req.body;

  if (!nombre || typeof nombre !== "string" || nombre.trim() === "") {
    res.status(400).json({
      ok: false,
      mensaje: `El nombre es obligatorio y debe ser texto.`,
    });
    return;
  }

  if (!precio || typeof precio !== "number" || precio <= 0) {
    res.status(400).json({
      ok: false,
      mensaje: `El precio debe ser un número mayor a 0.`,
    });
    return;
  }
  next();
};

const verificarRol = (rolMinimo: "MODERADOR" | "ADMIN") => {
  return (req: Request, res: Response, next: NextFunction) => {
    const rolHeader = req.headers["x-rol"];
    const rol = String(rolHeader).toUpperCase();
    if (!rol) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. No se proporciona ningun rol.`,
      });
    }

    if(rol !== "ADMIN" && rol !== "MODERADOR") {
        return res.status(401).json({
            ok: false,
            mensaje: `"${rol}" No es un rol valido.`,
        })
    }

    if (rolMinimo === "ADMIN" && rol !== "ADMIN") {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Se requiere rol: ADMIN.`,
      });
    }

    if (rolMinimo === "MODERADOR" && rol !== "MODERADOR" && rol !== "ADMIN") {
      return res.status(403).json({
        ok: false,
        mensaje: "Acceso denegado. Se requiere rol: MODERADOR o superior.",
      });
    }
    next();
  };
};

// LOGICA
interface Producto {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  activo: boolean;
}

const productos: Producto[] = [
  {
    id: 1,
    nombre: "Laptop Pro 15",
    precio: 1200.5,
    stock: 15,
    activo: true,
  },
  {
    id: 2,
    nombre: "Mouse Inalámbrico Ergonómico",
    precio: 45.99,
    stock: 50,
    activo: true,
  },
  {
    id: 3,
    nombre: "Teclado Mecánico RGB",
    precio: 89.0,
    stock: 0,
    activo: false,
  },
];

app.get("/api/productos", (req: Request, res: Response) => {
  const filtradoLista = productos.filter((p) => p.activo === true);
  if (filtradoLista.length === 0) {
   return res.status(200).json({
      ok: true,
      mensaje: `No hay productos por mostrar.`,
    });
  }
  return res.status(200).json({
    ok: true,
    mensaje: `Lista de productos`,
    data: filtradoLista,
  });
});

app.post("/api/productos", validarProducto, (req: Request, res: Response) => {
  const { nombre, precio, stock, activo } = req.body;
  let nuevoProducto: Producto = {
    id: productos.length + 1,
    nombre,
    precio,
    stock,
    activo,
  };
  productos.push(nuevoProducto);
  res.status(201).json({
    ok: true,
    mensaje: `El producto ha sido agregado con exito.`,
  });
});

app.patch(
  "/api/productos/soft/:id",
  verificarRol("MODERADOR"),
  (req: Request, res: Response) => {
    const idBuscando = Number(req.params.id);
    const idEncontrado = productos.findIndex((p) => {
      return p.id === idBuscando;
    });

    if (idEncontrado === -1) {
      return res.status(404).json({
        ok: false,
        mensaje: `No se encontró el ID: ${idBuscando}.`,
      });
    }

    const productoCambiado = productos[idEncontrado];
    productoCambiado.activo = false;

    res.status(200).json({
      ok: true,
      mensaje: `El producto de ID: ${idBuscando} ya no esta activo.`,
    });
  },
);

app.delete("/api/productos/hard/:id", verificarRol("ADMIN"), (req: Request, res: Response) => {
    const idBuscando = Number(req.params.id);
    const encontrarProducto = productos.findIndex((p) => p.id === idBuscando);

    if (encontrarProducto === -1) {
        return res.status(404).json({
            ok: false,
            mensaje: `No se encontró el ID: ${idBuscando}`
        })
    }

    productos.splice(encontrarProducto, 1);

    res.status(200).json({
        ok: true,
        mensaje: `Se eliminó el producto de ID: ${idBuscando} definitivamente`
    })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en: http://localhost:${PORT}`);
});
