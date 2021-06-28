const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // cara ambil data header pada request
    const headAuth = req.get('Authorization');
    // console.log(`headAuth -> ${headAuth}`);

    if (!headAuth) {
        req.isAuth = false;
        return next()
    }

    const token = headAuth.split(' ')[1];
    // console.log(`extracted token -> ${token}`);

    // verifikasi token dgn jwt
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, 'superdupersecretkey');
        // console.dir(`decodedToken -> ${JSON.stringify(decodedToken)}`);
    } catch (err) {
        req.isAuth = false;
        return next()
    }

    // cek jika decodedToken undefined
    if(!decodedToken){
        req.isAuth = false;
        return next()
    }

    // jika semua verifikasi lolos, masukkan userId ke req untuk diteruskan ke controller dalam route feed
    req.userId = decodedToken.userId;
    req.isAuth = true;
    return next();

};