'use client'

import React from 'react'
import Explore from './Explore'
import { InstitutionRedirect } from '@/components/auth/InstitutionRedirect'

const page = () => {
	return (
		<InstitutionRedirect>
			<div>
				<Explore />
			</div>
		</InstitutionRedirect>
	)
}

export default page
