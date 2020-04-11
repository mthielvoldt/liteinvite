//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const guestEmail = document.getElementById("guest-email").innerText;
const meetId = document.getElementById("meetup-id").innerText;
const guestListRoute = "/events/" + meetId + "/guests";
console.log("meetId: " + meetId);

const rootElement = document.getElementById("guest-list");
ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    rootElement
);

function App() {
    const [guests, setGuests] = useState([]);

    // run only once at page-load to populate the guest-list
    useEffect(() => {
        fetch(guestListRoute)
            .then(res => res.json())
            .then((fetchedGuests) => {
                setGuests(fetchedGuests);
            })
            .catch(error => console.log(error));
    }, []);

    function addGuest(newGuest) {
        console.log(newGuest);

        // Check to see if this email has been entered before (case-insensitive match)
        const hasMatch = guests.some((guest) => guest.name.toUpperCase() === newGuest.name.toUpperCase());

        if (hasMatch) {
            console.log("email matches one previously entered.");
        } else {
            setGuests([...guests, newGuest]);
        }
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <GuestList guests={guests} />
            <RSVP addGuest={addGuest} />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h2 className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-shadow">Who's Coming:</span>
            <span className="badge badge-secondary badge-pill">{props.numGuests}</span>
        </h2>
    );
}
function GuestList(props) {
    return (
        <ul className="list-group mb-3">
            {props.guests.map((guest, index) => (
                guest.status && <GuestLine guest={guest} key={index} />
            ))}
        </ul>
    );
}

function GuestLine(props) {
    return (
        <li className="event-detail list-group-item d-flex lh-condensed">
            <div className="guest-text guest-email">
                <strong >{props.guest.name}</strong>
            </div>
            <div className="guest-text guest-status text-success">
                    {props.guest.status === 2 && <h4>{'\u2714'}</h4>}
                    {props.guest.status === 1 && (<h4 className="text-warning">?</h4>)}
            </div>
        </li>
    );
}

function RSVP(props) {
    const [coming, setComing] = useState(false);

    return (
        coming ?
            (<div><GuestAdd addGuest={props.addGuest} />
                <button className="btn btn-secondary" onClick={() => { setComing(false) }} > Cancel </button>
            </div>) :
            (<button className="btn btn-primary" onClick={() => { setComing(true); }}> RSVP </button>)
    );
}

function ajaxSuccess() {
    console.log(this.responseText);
}
var xhrGuest = new XMLHttpRequest();
xhrGuest.onload = ajaxSuccess;

function GuestAdd(props) {

    const [guest, setGuest] = useState({ name: "", email: guestEmail, status: 0 });

    function submitGuest(newStatus) {
        //event.preventDefault();       // don't need this because buttons have type="button"
        guest.status = newStatus;
        xhrGuest.open("PUT", guestListRoute);
        xhrGuest.setRequestHeader('Content-type', 'application/json;charset=utf-8');
        xhrGuest.send(JSON.stringify(guest));
        props.addGuest(guest);
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setGuest({ ...guest, [name]: value });
    }

    return (
        <form className="card p-2 mb-2">
            <div className="input-group">
                <small className="text-muted">For event notifications only</small>
                <input type="email" className="" name="email" onChange={handleChange} value={guest.email} placeholder="Your email (optional)" />
                <small className="text-muted">This is what other guests will see</small>
                <input type="text" className="" name="name" onChange={handleChange} value={guest.name} placeholder="Enter a nickname" />
                <input type="hidden" name="status" value={guest.status} />
                <button type="button" className="btn btn-primary mb-2" onClick={() => submitGuest(2)}>I'm in!</button>
                <button type="button" className="btn btn-outline-primary mb-2" onClick={() => submitGuest(1)}>Maybe</button>
                <button type="button" className="btn btn-secondary mb-2" onClick={() => submitGuest(-1)}>Can't</button>
            </div>
        </form>
    )
}
