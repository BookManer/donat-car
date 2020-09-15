window.addEventListener('DOMContentLoaded', function() {
    const el_payForm = document.querySelector('.pay-form');
    el_payForm.addEventListener('submit', onSubmitPay);

    window.addEventListener('scroll', onScrollWindow);

    setupDonaters();
})

function onScrollWindow(e) {
    moveCar();
}

const el_car = document.querySelector('car');
const el_smoke = el_car.querySelector('span');
const rightSpace = window.innerWidth - el_car.offsetLeft;
function moveCar() {
    
    el_car.style.left = `${window.scrollY}%`;
    el_car.style.transform = 'rotate(0deg)';
    el_smoke.style.opacity = 1;
    el_car.style.top = 0;
     
    if (window.scrollY >= 40) {
        el_car.style.left = `${window.innerWidth - el_car.offsetLeft}px`;
        el_car.style.top = `${window.scrollY}px`; 
        el_car.style.transform = `rotate(${window.scrollY - 44}deg)`;
        el_smoke.style.opacity = 1-(window.scrollY/500);
        el_car.style.opacity = 1-(window.scrollY/800);
    }
}

async function onSubmitPay(e) {
    e.preventDefault();
    
    await payPlaceRating(e);
    await setupDonaters();
}

const host = 'http://localhost:8080';

async function setupDonaters() {
    try {
        const endpoint = '/api/qiwi/getAllDonaters';
        const el_itemsRating = document.querySelector('.items-rating');
        const json = await fetch(`${host}${endpoint}`);
        let donaters = await json.json();
        donaters.sort(({price:priceA}, {price:priceB}) => {
            return priceB - priceA;
        })
        
        donaters.forEach((donater) => {
            el_itemsRating.appendChild(renderDonater(donater));
        });
    } catch (e) {
        console.error(e);
    }

    function renderDonater({name, price, review}) {
        const first_name = name.split(' ')[1].substring(0, 1).toUpperCase();
        const last_name = name.split(' ')[0].substring(0, 1).toUpperCase();
        const el_donater = document.createElement('div');
        const randSmileSymbol = (Math.floor(Math.random()*100+1));
        el_donater.className = 'item-rating';
        el_donater.innerHTML = `
        <div class="avatar">	
        &#128${507+randSmileSymbol};</br>${first_name}${last_name}</div>
            <div class="persona-review">
                <h3 class="persona-review__name">${name}</h3>
                <p class="persona-review__review">${review}</p>
            </div>
        <span class="persona-review__price">${price} руб</span>`;

        return el_donater;
    }
}
async function payPlaceRating(e) {
    const name = e.currentTarget.querySelector('[name="name"]').value;
    const email = e.currentTarget.querySelector('[name="email"]').value;
    const price = e.currentTarget.querySelector('[name="price"]').value;
    // const phone = e.currentTarget.querySelector('[name="phone"]').value;
    const review = e.currentTarget.querySelector('[name="review"]').value;
    const endpointAPI = '/api/qiwi/payPlaceRating';

    const params = `v=2&name=${name}&email=${email}&price=${price}&review=${review}`;

    return new Promise(async (rej, res) => {
        const json = await fetch(`${host}${endpointAPI}?${params}`);
        const payUrl = await json.json();
        console.log('opened');
        QiwiCheckout.openInvoice({payUrl}).then((data) => {
            console.log(data);
            res(data);
        }).catch((error) => {
            rej(error);
        })
        console.log('closed');
    })
}