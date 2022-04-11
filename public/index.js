const userGrid = document.getElementById('userGrid');

(async () => {
    const users = await (await fetch('/api/v1/users')).json();
    users.forEach(user => {
        const { _id: name, imgs } = user;
        userGrid.innerHTML += `<div class='card'>
            <img src='/api/v1/userImages/${imgs[0]}' />
            <h1>${name}</h1>
            <form action='/api/v1/userDelete/${name}' method='post'>
                <button type='submit'><h2>X</h2></button>
            </form>
        </div>`;
    })
})()