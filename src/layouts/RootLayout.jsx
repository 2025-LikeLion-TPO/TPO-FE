import React from 'react'
import { Outlet } from 'react-router-dom'
import Nav from '../components/common/Nav'
import Header from '../components/common/Header'

const RootLayout = () => {
    return (
        <div className='body'>
            <Header />
            <main className='page-container'>
                <Outlet />
            </main>
            <Nav />
        </div>
    )
}

export default RootLayout