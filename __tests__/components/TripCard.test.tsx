import { render, screen, fireEvent } from '@testing-library/react'
import TripCard, { type TripData } from '@/components/trip/TripCard'

const mockTrip: TripData = {
  id: 'trip1',
  label: 'Work Commute',
  fromPlace: {
    kind: 'site',
    id: 'from1',
    name: 'Home Station',
    latitude: 59.3293,
    longitude: 18.0686
  },
  toPlace: {
    kind: 'site', 
    id: 'to1',
    name: 'Work Station',
    latitude: 59.3393,
    longitude: 18.0786
  },
  pinned: false
}

describe('TripCard', () => {
  it('renders trip information correctly', () => {
    render(<TripCard trip={mockTrip} />)
    
    expect(screen.getByText('Work Commute')).toBeInTheDocument()
    expect(screen.getByText('Home Station → Work Station')).toBeInTheDocument()
  })

  it('shows route description when no label', () => {
    const tripWithoutLabel = { ...mockTrip, label: null }
    render(<TripCard trip={tripWithoutLabel} />)
    
    expect(screen.getByText('Home Station → Work Station')).toBeInTheDocument()
  })

  it('calls onRun when Run button is clicked', () => {
    const onRun = jest.fn()
    render(<TripCard trip={mockTrip} onRun={onRun} />)
    
    const runButton = screen.getByRole('button', { name: /run/i })
    fireEvent.click(runButton)
    
    expect(onRun).toHaveBeenCalledWith(mockTrip)
  })

  it('calls onDelete when Remove button is clicked', () => {
    const onDelete = jest.fn()
    render(<TripCard trip={mockTrip} onDelete={onDelete} />)
    
    const deleteButton = screen.getByRole('button', { name: /remove/i })
    fireEvent.click(deleteButton)
    
    expect(onDelete).toHaveBeenCalledWith('trip1')
  })

  it('shows correct pin button text', () => {
    const onPin = jest.fn()
    
    // Test unpinned state
    render(<TripCard trip={mockTrip} onPin={onPin} />)
    expect(screen.getByRole('button', { name: /pin/i })).toBeInTheDocument()
    
    // Test pinned state
    const pinnedTrip = { ...mockTrip, pinned: true }
    render(<TripCard trip={pinnedTrip} onPin={onPin} />)
    expect(screen.getByRole('button', { name: /unpin/i })).toBeInTheDocument()
  })

  it('hides actions when showActions is false', () => {
    render(<TripCard trip={mockTrip} showActions={false} onRun={jest.fn()} />)
    
    expect(screen.queryByRole('button', { name: /run/i })).not.toBeInTheDocument()
  })

  it('renders with interactive variant', () => {
    render(<TripCard trip={mockTrip} variant="interactive" />)
    
    // Should have appropriate styling classes for interactive variant
    const cardElement = screen.getByText('Work Commute').closest('div')?.parentElement
    expect(cardElement).toHaveClass('cursor-pointer')
  })
})