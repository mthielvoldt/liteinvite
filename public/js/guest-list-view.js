//import React, { useState, useEffect } from "react";

const useState = React.useState;
const useEffect = React.useEffect;

const guestEmail = document.getElementById("guest-email").innerText;
const guestName = document.getElementById("guest-name").innerText;
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

    function updateGuestList(newGuestList) {
        setGuests(newGuestList);
    }

    return (
        <div className="App ">
            <GuestHeader numGuests={guests.length} />
            <GuestList guests={guests} />
            <RSVP updateGuestList={updateGuestList} />
        </div>
    );
}

function GuestHeader(props) {
    return (
        <h2 className="d-flex justify-content-between align-items-center mb-3">
            <span className="event-h">Who's Coming:</span>
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
        <li className="event-view-box list-group-item d-flex lh-condensed">
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
    const [viewState, setViewState] = useState({ windowVisible: false, message: "" });

    var xhrGuest = new XMLHttpRequest();
    xhrGuest.onload = () => {
        let response = JSON.parse(xhrGuest.response);
        console.log(response);
        setViewState({ windowVisible: false, message:response.message });

        if( typeof response.guestList !== 'undefined') {
            props.updateGuestList(response.guestList);  // pass data up.
        }
    };

    function putGuest(guest) {

        // Send the PUT request. 
        xhrGuest.open("PUT", guestListRoute);
        xhrGuest.setRequestHeader('Content-type', 'application/json;charset=utf-8');
        xhrGuest.send(JSON.stringify(guest));

        // close the RSVP window.
        //setWindowVisible(false);
    }
    function setWindowVisible(visible) {
        setViewState({ ...viewState, windowVisible: visible });
    }

    return (
        viewState.windowVisible ?
            (
                <div><GuestAdd putGuest={putGuest} />
                    <button
                        className="btn btn-secondary"
                        onClick={() => setWindowVisible(false)}> Cancel </button>
                </div>
            ) : (
                <div>
                    <button className="btn btn-primary mb-3" onClick={() => setWindowVisible(true)}> RSVP </button>
                    {viewState.message && (<div className="alert alert-info" role="alert">{viewState.message}</div>)}
                </div>
            )
    );
}


function GuestAdd(props) {

    const [guest, setGuest] = useState({ name: guestName, email: guestEmail, status: 0 });

    function submitGuest(newStatus) {
        guest.status = newStatus;
        props.putGuest(guest);
    }

    function handleChange(event) {
        const { name, value } = event.target;
        setGuest({ ...guest, [name]: value });
    }

    return (
        <form className="card p-2 mb-2">
            <div className="input-group">
                <small>This RSVP is for</small>
                <p>{guest.email}</p>
                <small className="text-muted">This is what other guests will see</small>
                <input type="text" className="w-100 mb-2" name="name" onChange={handleChange} value={guest.name} placeholder="Your nickname for this event" />
                <input type="hidden" name="status" value={guest.status} />
                <button type="button" className="btn btn-primary btn-block" onClick={() => submitGuest(2)}>I'm in!</button>
                <button type="button" className="btn btn-outline-primary btn-block" onClick={() => submitGuest(1)}>Maybe</button>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => submitGuest(-1)}>Can't</button>
            </div>
        </form>
    )
}
